'use strict';

class Bug {
    static #ANGULAR_VELOCITY = Math.PI; // rad/s
    static #ATTRIBUTES = ['position', 'normal'];
    static #SHADER_FRAGMENT = './glsl/bug.frag';
    static #SHADER_VERTEX = './glsl/bug.vert';
    static #UNIFORMS = {
        projection: (gl, uniform, projection) => gl.uniformMatrix4fv(uniform, false, projection),
        view: (gl, uniform, view) => gl.uniformMatrix4fv(uniform, false, view),
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

    #garden;
    #task;
    #x;
    #y;
    #z;
    #yaw;
    #velocity;
    #angularVelocity;

    constructor(gl, garden) { // TODO improve camera, animate, improve movement smoothness, do not move over water, mouse controls, start and finish in map, more bugs, sound
        return (async () => {
            this.#garden = garden;
            const renderer = await new Renderer(gl, Bug.#SHADER_VERTEX, Bug.#SHADER_FRAGMENT, Bug.#UNIFORMS,
                    Bug.#ATTRIBUTES);
            const bug = new Ellipsoid(0.075, 0.05, 0.05, 16, 8);
            this.#task = new RenderingTask(gl, renderer, [
                {vbo: new VertexBufferObject(gl, gl.ARRAY_BUFFER, new Float32Array(bug.positions)),
                    location: renderer.attributes.position, size: Vector.COMPONENTS, type: gl.FLOAT},
                {vbo: new VertexBufferObject(gl, gl.ARRAY_BUFFER, new Float32Array(bug.normals)),
                    location: renderer.attributes.normal, size: Vector.COMPONENTS, type: gl.FLOAT}
            ], new VertexBufferObject(gl, gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(bug.indices), gl.STATIC_DRAW), bug.indices.length);
            this.#x = 0.0;
            this.#y = 0.0;
            this.#z = 0.0;
            this.#yaw = 0.0;
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

    get yaw() {
        return this.#yaw;
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

    render(projection, view, light) {
        this.#task.render({projection, view, model: this.#model, light}); // TODO do not set all here
    }

    idle(dt) {
        this.#x = Math.min(Math.max(this.#x + Math.cos(this.#yaw) * this.#velocity * dt, 0), this.#garden.longitude);
        this.#y = Math.min(Math.max(this.#y + Math.sin(this.#yaw) * this.#velocity * dt, 0), this.#garden.latitude);
        this.#z = this.#garden.getAltitude(this.#y, this.#x);
        this.#yaw = this.#yaw + this.#angularVelocity * dt;
        if (this.#yaw < 0) {
            this.#yaw += 2 * Math.PI;
        } else if (this.#yaw >= 2 * Math.PI) {
            this.#yaw -= 2 * Math.PI;
        }
    }

    get #model() {
        const model = mat4.create();
        mat4.translate(model, model, [this.#x, this.#y, this.#z]);
        mat4.rotateZ(model, model, this.#yaw);
        return model;
    }
}
