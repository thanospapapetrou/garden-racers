'use strict';

class GardenRacers {
    static #CONTEXT = 'webgl2';
    static #CLEAR = {
        color: [0.0, 0.0, 0.0, 1.0], // black
        depth: 1.0 // max
    };
    static #DISTANCE = {
        min: 0.5, // 0.5 m
        max: 5.5 // 5.5 m
    };
    static #FORMAT_ANGLE = (angle) => `${angle} rad (${angle * 180 / Math.PI} °)`;
    static #FORMAT_DISTANCE = (distance) => `${distance} m`;
    static #LIGHT = {
        ambient: [0.25, 0.25, 0.25], // 25% white
        directional: {
            color: [0.75, 0.75, 0.75], // 75% white
            direction: [-1.0, -1.0, -1.0] // from top right back
        }
    };
    static #MS_PER_S = 1000; // 1 s = 1000 ms
    static #PROJECTION = {
        fieldOfView: 1.57079632679, // π/2 rad
        z: {
            near: 0.01, // 0.01 m
            far: 180.312229203 // ~ 180 m; based on max garden diagonal
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
    #bug;
    #azimuth;
    #elevation;
    #distance;
    #velocityAzimuth;
    #velocityElevation;
    #velocityDistance;
    #time;

    static async main() {
        const gl = document.querySelector(GardenRacers.#SELECTOR_CANVAS).getContext(GardenRacers.#CONTEXT);
        const racers = await new GardenRacers(gl, './json/garden.json');
        requestAnimationFrame(racers.render.bind(racers));
    }

    constructor(gl, garden) {
        this.#gl = gl;
        return (async () => {
            this.#garden = await new Garden(this.#gl, garden, this.#projection);
            this.#bug = await new Bug(this.#gl, this.#projection, this.#garden);
            this.#azimuth = 0.0;
            this.elevation = 0.0;
            this.distance = GardenRacers.#DISTANCE.min;
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
        this.#azimuth = Math.min(Math.max(azimuth, -Math.PI), Math.PI);
        document.querySelector(GardenRacers.#SELECTOR_AZIMUTH).firstChild.nodeValue
                = GardenRacers.#FORMAT_ANGLE(this.#azimuth);
    }

    get elevation() {
        return this.#elevation;
    }

    set elevation(elevation) {
        this.#elevation = Math.min(Math.max(elevation, 0), Math.PI / 2);
        document.querySelector(GardenRacers.#SELECTOR_ELEVATION).firstChild.nodeValue
                = GardenRacers.#FORMAT_ANGLE(this.#elevation);
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
            case KeyCode.PAGE_UP:
                this.#velocityElevation = GardenRacers.#VELOCITY.elevation;
                this.#velocityDistance = GardenRacers.#VELOCITY.distance;
                break;
            case KeyCode.PAGE_DOWN:
                this.#velocityElevation = -GardenRacers.#VELOCITY.elevation;
                this.#velocityDistance = -GardenRacers.#VELOCITY.distance;
                break;
            case KeyCode.A:
                this.#velocityAzimuth = -GardenRacers.#VELOCITY.azimuth;
                break;
            case KeyCode.D:
                this.#velocityAzimuth = GardenRacers.#VELOCITY.azimuth;
                break;
            case KeyCode.S:
                this.#azimuth = 0.0;
                break;
            }
        }
        this.#bug.keyboard(event);
    }

    render(time) {
        this.idle(time);
        this.#gl.clear(this.#gl.COLOR_BUFFER_BIT | this.#gl.DEPTH_BUFFER_BIT);
        this.#garden.render(this.#view, GardenRacers.#LIGHT);
        this.#bug.render(this.#view, GardenRacers.#LIGHT);
        requestAnimationFrame(this.render.bind(this));
    }

    idle(time) {
        const dt = (time - this.#time) / GardenRacers.#MS_PER_S;
        this.#time = time;
        this.fps = 1 / dt;
        this.azimuth += this.#velocityAzimuth * dt;
        this.elevation += this.#velocityElevation * dt;
        this.distance += this.#velocityDistance * dt;
        this.#bug.idle(dt);
    }

    get #projection() {
        const projection = mat4.create();
        mat4.perspective(projection, GardenRacers.#PROJECTION.fieldOfView,
                this.#gl.canvas.clientWidth / this.#gl.canvas.clientHeight,
                GardenRacers.#PROJECTION.z.near, GardenRacers.#PROJECTION.z.far);
        return projection;
    }

    get #view() {
        const view = mat4.create();
        mat4.lookAt(view, vec3.fromValues(
                this.#bug.x - this.#distance * Math.cos(this.#elevation) * Math.cos(this.#bug.yaw + this.#azimuth),
                this.#bug.y - this.#distance * Math.cos(this.#elevation) * Math.sin(this.#bug.yaw + this.#azimuth),
                this.#bug.z + this.#distance * Math.sin(this.#elevation)),
                vec3.fromValues(this.#bug.x, this.#bug.y, this.#bug.z),
                vec3.fromValues(Math.sin(this.#elevation) * Math.cos(this.#bug.yaw + this.#azimuth),
                Math.sin(this.#elevation) * Math.sin(this.#bug.yaw + this.#azimuth), Math.cos(this.#elevation)));
        return view;
    }
}
