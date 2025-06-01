'use strict';

class Bug {
    static #ANGULAR_VELOCITY = Math.PI; // rad/s
    static #ATTRIBUTE_NORMAL = 'normal';
    static #ATTRIBUTE_POSITION = 'position';
    static #SHADER_FRAGMENT = './glsl/bug.frag';
    static #SHADER_VERTEX = './glsl/bug.vert';
    static #UBO_LIGHT = 'light';
    static #UBO_PROJECTION_VIEW_MODEL = 'projectionViewModel';
    static #UNIFORM_AMBIENT = 'ambient';
    static #UNIFORM_DIRECTIONAL_COLOR = 'directional.color';
    static #UNIFORM_DIRECTIONAL_DIRECTION = 'directional.direction';
    static #UNIFORM_MODEL = 'model';
    static #UNIFORM_PROJECTION = 'projection';
    static #UNIFORM_TERRAINS = 'terrains';
    static #UNIFORM_VIEW = 'view';
    static UBOS = {[Bug.#UBO_PROJECTION_VIEW_MODEL]: [Bug.#UNIFORM_PROJECTION, Bug.#UNIFORM_VIEW, Bug.#UNIFORM_MODEL],
            [Bug.#UBO_LIGHT]: [Bug.#UNIFORM_AMBIENT, Bug.#UNIFORM_DIRECTIONAL_COLOR, Bug.#UNIFORM_DIRECTIONAL_DIRECTION]
            };
    static #VELOCITY = 1.0;

    #gl;
    #program;
    #ubos;
    #thorax;
    #head;
    #abdomen;
    #garden;
    #x;
    #y;
    #z;
    #yaw;
    #velocity;
    #angularVelocity;

    constructor(gl, projection, garden) { // TODO animate, improve movement smoothness, do not move over water, mouse controls, start and finish in map, more bugs, sound
        // TODO femur, tibia, antenna
        this.#gl = gl;
        return (async () => {
            this.#program = new Program(gl, await new Shader(gl, gl.VERTEX_SHADER, Bug.#SHADER_VERTEX),
                    await new Shader(gl, gl.FRAGMENT_SHADER, Bug.#SHADER_FRAGMENT), [], [Bug.#ATTRIBUTE_POSITION,
                    Bug.#ATTRIBUTE_NORMAL]);
            this.#ubos = {};
            for (let i = 0; i < Object.keys(Bug.UBOS).length; i++) {
                this.#ubos[Object.keys(Bug.UBOS)[i]] = new UniformBufferObject(gl, i + Object.keys(Garden.UBOS).length,
                        this.#program.program, Object.keys(Bug.UBOS)[i], Object.values(Bug.UBOS)[i]);
            }
            this.#ubos[Bug.#UBO_PROJECTION_VIEW_MODEL].setUniforms({[Bug.#UNIFORM_PROJECTION]: projection});
            const thorax = new Ellipsoid(0.1, 0.05, 0.05, 16, 8); // TODO
            this.#thorax = {vao: new VertexArrayObject(gl, Object.entries({[Bug.#ATTRIBUTE_POSITION]: thorax.positions,
                    [Bug.#ATTRIBUTE_NORMAL]: thorax.normals})
                    .map(([attribute, data]) => this.#getFloatVbo(attribute, data)),
                    new VertexBufferObject(gl, gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(thorax.indices))),
                    count: thorax.indices.length};
            const head = new Ellipsoid(0.1, 0.1, 0.1, 16, 8);
            this.#head = {vao: new VertexArrayObject(gl, Object.entries({[Bug.#ATTRIBUTE_POSITION]: head.positions,
                    [Bug.#ATTRIBUTE_NORMAL]: head.normals})
                    .map(([attribute, data]) => this.#getFloatVbo(attribute, data)),
                    new VertexBufferObject(gl, gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(head.indices))),
                    count: head.indices.length};
            const abdomen = new Ellipsoid(0.2, 0.1, 0.1, 16, 8);
            this.#abdomen = {vao: new VertexArrayObject(gl, Object.entries({
                    [Bug.#ATTRIBUTE_POSITION]: abdomen.positions, [Bug.#ATTRIBUTE_NORMAL]: abdomen.normals})
                    .map(([attribute, data]) => this.#getFloatVbo(attribute, data)),
                    new VertexBufferObject(gl, gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(abdomen.indices))),
                    count: abdomen.indices.length};
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
        this.#ubos[Bug.#UBO_PROJECTION_VIEW_MODEL].setUniforms({[Bug.#UNIFORM_VIEW]: view,
                [Bug.#UNIFORM_MODEL]: this.#model});
        this.#ubos[Bug.#UBO_LIGHT].setUniforms({[Bug.#UNIFORM_AMBIENT]: new Float32Array(light.ambient),
            [Bug.#UNIFORM_DIRECTIONAL_COLOR]: new Float32Array(light.directional.color),
            [Bug.#UNIFORM_DIRECTIONAL_DIRECTION]: new Float32Array(light.directional.direction)});
        this.#gl.bindVertexArray(this.#thorax.vao.vao);
        this.#gl.drawElements(this.#gl.TRIANGLES, this.#thorax.count, this.#gl.UNSIGNED_INT, 0);
        this.#ubos[Bug.#UBO_PROJECTION_VIEW_MODEL].setUniforms({[Bug.#UNIFORM_MODEL]: this.#headModel});
        this.#gl.bindVertexArray(this.#head.vao.vao);
        this.#gl.drawElements(this.#gl.TRIANGLES, this.#head.count, this.#gl.UNSIGNED_INT, 0);
        this.#ubos[Bug.#UBO_PROJECTION_VIEW_MODEL].setUniforms({[Bug.#UNIFORM_MODEL]: this.#abdomenModel});
        this.#gl.bindVertexArray(this.#abdomen.vao.vao);
        this.#gl.drawElements(this.#gl.TRIANGLES, this.#abdomen.count, this.#gl.UNSIGNED_INT, 0);
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

    #getFloatVbo(attribute, data) {
        return {vbo: new VertexBufferObject(this.#gl, this.#gl.ARRAY_BUFFER, new Float32Array(data)),
                location: this.#program.attributes[attribute], size: Vector.COMPONENTS, type: this.#gl.FLOAT};
    }

    get #model() {
        const model = mat4.create();
        mat4.translate(model, model, [this.#x, this.#y, this.#z + 0.2]);
        mat4.rotateZ(model, model, this.#yaw);
        return model;
    }

    get #headModel() {
        const model = this.#model;
        mat4.translate(model, model, [0.1, 0.0, 0.0]);
        mat4.rotateY(model, model, Math.PI / 6);
        mat4.translate(model, model, [0.1, 0.0, 0.0]);
        return model;
    }

    get #abdomenModel() {
        const model = this.#model;
        mat4.translate(model, model, [-0.1, 0.0, 0.0]);
        mat4.rotateY(model, model, -Math.PI / 6);
        mat4.translate(model, model, [-0.2, 0.0, 0.0]);
        return model;
    }
}
