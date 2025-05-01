'use strict';

class GardenRacers {
    static #CONTEXT = 'webgl2';
    static #CLEAR = {
        color: [0.0, 0.0, 0.0, 1.0], // black
        depth: 1.0 // max
    };
    static #DISTANCE = {
        min: 0.5, // 0.5 m
        max: 50.0 // 50 m
    };
    static #FORMAT_ANGLE = (angle) => `${angle} rad (${angle * 180 / Math.PI} °)`;
    static #FORMAT_DISTANCE = (distance) => `${distance} m`;
    static #MS_PER_S = 1000; // 1 s = 1000 ms
    static #PROJECTION = {
        fieldOfView: 1.57079632679, // π/2 rad
        z: {
            near: 0.1, // 0.1 m
            far: 100.0 // 100 m
        }
    };
    static #SELECTOR_AZIMUTH = 'span#azimuth';
    static #SELECTOR_CANVAS = 'canvas#gardenRacers';
    static #SELECTOR_DISTANCE = 'span#distance';
    static #SELECTOR_ELEVATION = 'span#elevation';
    static #SELECTOR_FPS = 'span#fps';
    static #VELOCITY = {
        azimuth: 1.57079632679, // π/2 rad/s
        elevation: 1.57079632679, // π/2 rad/s
        distance: 5.0 // 5 m/s
    };

    #gl;
    #garden;
    #azimuth;
    #elevation;
    #distance;
    #velocityAzimuth;
    #velocityElevation;
    #velocityDistance;
    #time;

    static async main() {
        const gl = document.querySelector(GardenRacers.#SELECTOR_CANVAS).getContext(GardenRacers.#CONTEXT);
        const racers = await new GardenRacers(gl);
        requestAnimationFrame(racers.render.bind(racers));
    }

    constructor(gl) {
        this.#gl = gl;
        return (async () => {
            this.#garden = await new Garden(this.#gl);
            this.azimuth = 0.0;
            this.elevation = 0.0;
            this.distance = GardenRacers.#DISTANCE.max;
            this.#velocityAzimuth = 0.0;
            this.#velocityElevation = 0.0;
            this.#velocityDistance = 0.0;
            this.#time = 0;
            this.#gl.clearColor(...GardenRacers.#CLEAR.color);
            this.#gl.clearDepth(GardenRacers.#CLEAR.depth);
            this.#gl.depthFunc(this.#gl.LEQUAL);
            this.#gl.enable(this.#gl.DEPTH_TEST);
            this.#gl.cullFace(this.#gl.BACK);
            this.#gl.enable(this.#gl.CULL_FACE);
            this.#gl.canvas.addEventListener(Event.KEY_DOWN, this.keyboard.bind(this));
            this.#gl.canvas.addEventListener(Event.KEY_UP, this.keyboard.bind(this));
            this.#gl.canvas.focus();
            return this;
        })();
    }

    get azimuth() {
        return this.#azimuth;
    }

    set azimuth(azimuth) {
        this.#azimuth = azimuth;
        if (this.#azimuth < 0) {
            this.#azimuth += 2 * Math.PI;
        } else if (this.#azimuth >= 2 * Math.PI) {
            this.#azimuth -= 2 * Math.PI;
        }
        document.querySelector(GardenRacers.#SELECTOR_AZIMUTH).firstChild.nodeValue =
                GardenRacers.#FORMAT_ANGLE(this.#azimuth);
    }

    get elevation() {
        return this.#elevation;
    }

    set elevation(elevation) {
        this.#elevation = Math.min(Math.max(elevation, -Math.PI / 2), Math.PI / 2);
        document.querySelector(GardenRacers.#SELECTOR_ELEVATION).firstChild.nodeValue =
                GardenRacers.#FORMAT_ANGLE(this.#elevation);
    }

    get distance() {
        return this.#distance;
    }

    set distance(distance) {
        this.#distance = Math.min(Math.max(distance, GardenRacers.#DISTANCE.min), GardenRacers.#DISTANCE.max);
        document.querySelector(GardenRacers.#SELECTOR_DISTANCE).firstChild.nodeValue =
                GardenRacers.#FORMAT_DISTANCE(this.#distance);
    }

    set fps(fps) {
        document.querySelector(GardenRacers.#SELECTOR_FPS).firstChild.nodeValue = fps;
    }


    keyboard(event) {
        this.#velocityAzimuth = 0.0;
        this.#velocityElevation = 0.0;
        this.#velocityDistance = 0.0;
        if (event.type == Event.KEY_DOWN) {
            switch (event.code) {
            case KeyCode.ARROW_UP:
                this.#velocityElevation = GardenRacers.#VELOCITY.elevation;
                break;
            case KeyCode.ARROW_DOWN:
                this.#velocityElevation = -GardenRacers.#VELOCITY.elevation;
                break;
            case KeyCode.ARROW_LEFT:
                this.#velocityAzimuth = GardenRacers.#VELOCITY.azimuth;
                break;
            case KeyCode.ARROW_RIGHT:
                this.#velocityAzimuth = -GardenRacers.#VELOCITY.azimuth;
                break;
            case KeyCode.PAGE_UP:
                this.#velocityDistance = GardenRacers.#VELOCITY.distance;
                break;
            case KeyCode.PAGE_DOWN:
                this.#velocityDistance = -GardenRacers.#VELOCITY.distance;
                break;
            }
        }
    }

    render(time) {
        this.idle(time);
        this.#gl.clear(this.#gl.COLOR_BUFFER_BIT | this.#gl.DEPTH_BUFFER_BIT);
        this.#garden.render(this.#projection, this.#camera, this.#model);
        requestAnimationFrame(this.render.bind(this));
    }

    idle(time) {
        const dt = (time - this.#time) / GardenRacers.#MS_PER_S;
        this.fps = 1 / dt;
        this.azimuth += this.#velocityAzimuth * dt;
        this.elevation += this.#velocityElevation * dt;
        this.distance += this.#velocityDistance * dt;
        this.#time = time;
    }

    get #projection() {
        const projection = mat4.create();
        mat4.perspective(projection, GardenRacers.#PROJECTION.fieldOfView,
                this.#gl.canvas.clientWidth / this.#gl.canvas.clientHeight, GardenRacers.#PROJECTION.z.near,
                GardenRacers.#PROJECTION.z.far);
        return projection;
    }

    get #camera() {
        const camera = mat4.create();
        mat4.rotateY(camera, camera, -this.azimuth);
        mat4.rotateX(camera, camera, -this.elevation);
        mat4.translate(camera, camera, [0.0, 0.0, this.distance]);
        return camera;
    }

    get #model() {
        return mat4.create();
    }
}
