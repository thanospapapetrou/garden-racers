'use strict';

class Bug {
    static #ANGULAR_VELOCITY = Math.PI; // rad/s
    static #ATTRIBUTES = ['position', 'normal'];
    static #SHADER_FRAGMENT = './glsl/bug.frag';
    static #SHADER_VERTEX = './glsl/bug.vert';
    static #UNIFORMS = ['projection', 'view', 'model', 'light.ambient', 'light.directional.color',
            'light.directional.direction'];
    static #VELOCITY = 1.0;

    #gl;
    #program;
    #projectionViewModel;
    #light;
    #vao;
    #count;
    #garden;
    #x;
    #y;
    #z;
    #yaw;
    #velocity;
    #angularVelocity;

    constructor(gl, projection, garden) { // TODO improve camera, animate, improve movement smoothness, do not move over water, mouse controls, start and finish in map, more bugs, sound
        this.#gl = gl;
        return (async () => {
            this.#program = new Program(gl, await new Shader(gl, gl.VERTEX_SHADER, Bug.#SHADER_VERTEX),
                    await new Shader(gl, gl.FRAGMENT_SHADER, Bug.#SHADER_FRAGMENT), [], Bug.#ATTRIBUTES);
            this.#projectionViewModel = new UniformBufferObject(gl, this.#program.program, 'projectionViewModel',
                    ['projection', 'view', 'model'], 0);
            this.#projectionViewModel.setUniforms({projection});
            this.#light = new UniformBufferObject(gl, this.#program.program, 'light',
                    ['ambient', 'directional.color', 'directional.direction'], 1);
            const bug = new Ellipsoid(0.075, 0.05, 0.05, 16, 8); // TODO
            this.#vao = new VertexArrayObject(gl, [ // TODO improve
                {vbo: new VertexBufferObject(gl, gl.ARRAY_BUFFER, new Float32Array(bug.positions)),
                    location: this.#program.attributes.position, size: Vector.COMPONENTS, type: gl.FLOAT},
                {vbo: new VertexBufferObject(gl, gl.ARRAY_BUFFER, new Float32Array(bug.normals)),
                    location: this.#program.attributes.normal, size: Vector.COMPONENTS, type: gl.FLOAT}
            ], new VertexBufferObject(gl, gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(bug.indices)));
            this.#count = bug.indices.length;
            this.#garden = garden;
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

    render(view, light) {
        this.#gl.useProgram(this.#program.program);
        this.#projectionViewModel.setUniforms({view: view, model: this.#model});
        this.#light.setUniforms({ambient: new Float32Array(light.ambient),
            'directional.color': new Float32Array(light.directional.color),
            'directional.direction': new Float32Array(light.directional.direction)});
        this.#gl.bindVertexArray(this.#vao.vao);
        this.#gl.drawElements(this.#gl.TRIANGLES, this.#count, this.#gl.UNSIGNED_INT, 0);
        this.#gl.bindVertexArray(null);
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
