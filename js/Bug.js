'use strict';

class Bug {
    static #ANGULAR_VELOCITY = Math.PI; // rad/s
    static #ATTRIBUTES = ['position', 'normal'];
    static #SHADER_FRAGMENT = './glsl/bug.frag';
    static #SHADER_VERTEX = './glsl/bug.vert';
    static #UNIFORMS = {
        projection: (gl, uniform, projection) => gl.uniformMatrix4fv(uniform, false, projection),
        camera: (gl, uniform, camera) => gl.uniformMatrix4fv(uniform, false, camera),
        model: (gl, uniform, model) => gl.uniformMatrix4fv(uniform, false, model),
        light: {
            ambient: (gl, uniform, color) => gl.uniform3fv(uniform, color),
            directional: {
                color: (gl, uniform, color) => gl.uniform3fv(uniform, color),
                direction: (gl, uniform, direction) => gl.uniform3fv(uniform, direction)
            }
        }
    };
    static #VELOCITY = 1.0;

    #task;
    #x;
    #y;
    #z;
    #azimuth;
    #velocity;
    #angularVelocity;

    constructor(gl) {
        return (async () => {
            const renderer = await new Renderer(gl, Bug.#SHADER_VERTEX, Bug.#SHADER_FRAGMENT, Bug.#UNIFORMS,
                    Bug.#ATTRIBUTES);
            const bug = new Ellipsoid(0.075, 0.05, 0.05, 16, 8);
            this.#task = new RenderingTask(gl, renderer, {
                position: new AttributeData(gl, bug.positions),
                normal: new AttributeData(gl, bug.normals)
            }, new IndexData(gl, bug.indices));
            this.#x = 0.0;
            this.#y = 0.0;
            this.#z = 0.1; // TODO
            this.#azimuth = 0.0;
            this.#velocity = 0.0;
            this.#angularVelocity = 0.0;
            return this;
        })();
    }

    get x() {
        return this.#x;
    }

    get y() {
        return this.#y;
    }

    get z() {
        return this.#z;
    }

    get azimuth() {
        return this.#azimuth;
    }

    keyboard(event) {
        this.#velocity = 0.0;
        this.#angularVelocity = 0.0;
        if (event.type == Event.KEY_DOWN) {
            switch (event.code) {
            case KeyCode.ARROW_UP:
                this.#velocity = Bug.#VELOCITY;
                break;
            case KeyCode.ARROW_DOWN:
                this.#velocity = -Bug.#VELOCITY;
                break;
            case KeyCode.ARROW_LEFT:
                this.#angularVelocity = Bug.#ANGULAR_VELOCITY;
                break;
            case KeyCode.ARROW_RIGHT:
                this.#angularVelocity = -Bug.#ANGULAR_VELOCITY;
            }
        }
    }

    render(projection, camera, light) {
        this.#task.render({projection, camera, model: this.#model, light}); // TODO do not set all here
    }

    idle(dt) {
        this.#x += Math.cos(this.#azimuth) * this.#velocity * dt;
        this.#y += Math.sin(this.#azimuth) * this.#velocity * dt;
        this.#azimuth = this.#azimuth + this.#angularVelocity * dt;
        if (this.#azimuth < 0) {
            this.#azimuth += 2 * Math.PI;
        } else if (this.#azimuth >= 2 * Math.PI) {
            this.#azimuth -= 2 * Math.PI;
        }
    }

    get #model() {
        const model = mat4.create();
        mat4.translate(model, model, [this.#x, this.#y, this.#z]);
        mat4.rotateZ(model, model, this.#azimuth);
        return model;
    }
}
