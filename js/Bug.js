'use strict';

class Bug {
    static #ANGULAR_VELOCITY = Math.PI; // rad/s
    static #ANT = {
        thorax: {x: 0.1, y: 0.05, z: 0.05, sectors: 8, stacks: 4},
        head: {x: 0.075, y: 0.1, z: 0.075, sectors: 8, stacks: 4, angle: Math.PI / 12},
        abdomen: {x: 0.15, y: 0.1, z: 0.1, sectors: 8, stacks: 4, angle: -Math.PI / 12},
        femur: {radius: 0.01, height: 0.13247448713, sectors: 4, stacks: 2, verticalAngle: 7 * Math.PI / 12,
                horizontalAngles: [Math.PI / 4, 3 * Math.PI / 4, 0, Math.PI, -Math.PI / 4, 5 * Math.PI / 4]},
        tibia: {radius: 0.01, height: 0.13247448713, sectors: 4, stacks: 2, angle: Math.PI / 3},
        height: 0.15,
        color: [1.0, 1.0, 0.0, 1.0]
    };
    static #ATTRIBUTE_NORMAL = 'normal';
    static #ATTRIBUTE_POSITION = 'position';
    static #SHADER_FRAGMENT = './glsl/bug.frag';
    static #SHADER_VERTEX = './glsl/bug.vert';
    static #UBO_COLOR_LIGHT = 'colorLight';
    static #UBO_PROJECTION_VIEW_MODEL = 'projectionViewModel';
    static #UNIFORM_COLOR = 'color';
    static #UNIFORM_LIGHT_AMBIENT = 'light.ambient';
    static #UNIFORM_LIGHT_DIRECTIONAL_COLOR = 'light.directional.color';
    static #UNIFORM_LIGHT_DIRECTIONAL_DIRECTION = 'light.directional.direction';
    static #UNIFORM_MODEL = 'model';
    static #UNIFORM_PROJECTION = 'projection';
    static #UNIFORM_TERRAINS = 'terrains';
    static #UNIFORM_VIEW = 'view';
    static UBOS = {[Bug.#UBO_PROJECTION_VIEW_MODEL]: [Bug.#UNIFORM_PROJECTION, Bug.#UNIFORM_VIEW, Bug.#UNIFORM_MODEL],
            [Bug.#UBO_COLOR_LIGHT]: [Bug.#UNIFORM_COLOR, Bug.#UNIFORM_LIGHT_AMBIENT,
            Bug.#UNIFORM_LIGHT_DIRECTIONAL_COLOR, Bug.#UNIFORM_LIGHT_DIRECTIONAL_DIRECTION]};
    static #VELOCITY = 1.0;

    #gl;
    #program;
    #ubos;
    #thorax;
    #head;
    #abdomen;
    #femur;
    #tibia;
    #garden;
    #x;
    #y;
    #z;
    #yaw;
    #velocity;
    #angularVelocity;

    constructor(gl, projection, garden) { // TODO animate, improve movement smoothness, do not move over water, mouse controls, start and finish in map, more bugs, sound
        // TODO antennae, mandibles
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
            this.#thorax = this.#getVao(new Ellipsoid(Bug.#ANT.thorax.x, Bug.#ANT.thorax.y, Bug.#ANT.thorax.z,
                    Bug.#ANT.thorax.sectors, Bug.#ANT.thorax.stacks));
            this.#head = this.#getVao(new Ellipsoid(Bug.#ANT.head.x, Bug.#ANT.head.y, Bug.#ANT.head.z,
                    Bug.#ANT.head.sectors, Bug.#ANT.head.stacks));
            this.#abdomen = this.#getVao(new Ellipsoid(Bug.#ANT.abdomen.x, Bug.#ANT.abdomen.y, Bug.#ANT.abdomen.z,
                Bug.#ANT.abdomen.sectors, Bug.#ANT.abdomen.stacks));
            this.#femur = this.#getVao(new RoundedCylinder(Bug.#ANT.femur.radius, Bug.#ANT.femur.height,
                    Bug.#ANT.femur.sectors, Bug.#ANT.femur.stacks));
            this.#tibia = this.#getVao(new RoundedCylinder(Bug.#ANT.tibia.radius, Bug.#ANT.tibia.height,
                    Bug.#ANT.tibia.sectors, Bug.#ANT.tibia.stacks));
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
        this.#ubos[Bug.#UBO_COLOR_LIGHT].setUniforms({[Bug.#UNIFORM_COLOR]: new Float32Array(Bug.#ANT.color),
            [Bug.#UNIFORM_LIGHT_AMBIENT]: new Float32Array(light.ambient),
            [Bug.#UNIFORM_LIGHT_DIRECTIONAL_COLOR]: new Float32Array(light.directional.color),
            [Bug.#UNIFORM_LIGHT_DIRECTIONAL_DIRECTION]: new Float32Array(light.directional.direction)});
        this.#ubos[Bug.#UBO_PROJECTION_VIEW_MODEL].setUniforms({[Bug.#UNIFORM_VIEW]: view});
        this.#gl.bindVertexArray(this.#thorax.vao.vao);
        this.#ubos[Bug.#UBO_PROJECTION_VIEW_MODEL].setUniforms({[Bug.#UNIFORM_MODEL]: this.#thoraxModel});
        this.#gl.drawElements(this.#gl.TRIANGLES, this.#thorax.count, this.#gl.UNSIGNED_INT, 0);
        this.#gl.bindVertexArray(this.#head.vao.vao);
        this.#ubos[Bug.#UBO_PROJECTION_VIEW_MODEL].setUniforms({[Bug.#UNIFORM_MODEL]: this.#headModel});
        this.#gl.drawElements(this.#gl.TRIANGLES, this.#head.count, this.#gl.UNSIGNED_INT, 0);
        this.#gl.bindVertexArray(this.#abdomen.vao.vao);
        this.#ubos[Bug.#UBO_PROJECTION_VIEW_MODEL].setUniforms({[Bug.#UNIFORM_MODEL]: this.#abdomenModel});
        this.#gl.drawElements(this.#gl.TRIANGLES, this.#abdomen.count, this.#gl.UNSIGNED_INT, 0);
        this.#gl.bindVertexArray(this.#femur.vao.vao);
        for (let i = 0; i < Bug.#ANT.femur.horizontalAngles.length; i ++) {
            this.#ubos[Bug.#UBO_PROJECTION_VIEW_MODEL].setUniforms({[Bug.#UNIFORM_MODEL]: this.#getFemurModel(i)});
            this.#gl.drawElements(this.#gl.TRIANGLES, this.#femur.count, this.#gl.UNSIGNED_INT, 0);
        }
        this.#gl.bindVertexArray(this.#tibia.vao.vao);
        for (let i = 0; i < Bug.#ANT.femur.horizontalAngles.length; i ++) {
            this.#ubos[Bug.#UBO_PROJECTION_VIEW_MODEL].setUniforms({[Bug.#UNIFORM_MODEL]: this.#getTibiaModel(i)});
            this.#gl.drawElements(this.#gl.TRIANGLES, this.#tibia.count, this.#gl.UNSIGNED_INT, 0);
        }
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

    #getVao(object) {
        return {vao: new VertexArrayObject(this.#gl, [
                this.#getVbo(Bug.#ATTRIBUTE_POSITION, object.positions),
                this.#getVbo(Bug.#ATTRIBUTE_NORMAL, object.normals)],
                new VertexBufferObject(this.#gl, this.#gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(object.indices))),
                count: object.indices.length};
    }

    #getVbo(attribute, data) {
        return {vbo: new VertexBufferObject(this.#gl, this.#gl.ARRAY_BUFFER, new Float32Array(data)),
                location: this.#program.attributes[attribute], size: Vector.COMPONENTS, type: this.#gl.FLOAT};
    }

    get #model() {
        const model = mat4.create();
        mat4.translate(model, model, [this.#x, this.#y, this.#z]);
        mat4.rotateY(model, model, -Math.atan(this.#garden.getSlopeX(this.#y, this.#x)));
        mat4.rotateZ(model, model, this.#yaw);
        return model;
    }

    get #thoraxModel() {
        const model = this.#model;
        mat4.translate(model, model, [0.0, 0.0, Bug.#ANT.height]);
        return model;
    }

    get #headModel() {
        const model = this.#thoraxModel;
        mat4.translate(model, model, [Bug.#ANT.thorax.x, 0.0, 0.0]);
        mat4.rotateY(model, model, Bug.#ANT.head.angle);
        mat4.translate(model, model, [Bug.#ANT.head.x, 0.0, 0.0]);
        return model;
    }

    get #abdomenModel() {
        const model = this.#thoraxModel;
        mat4.translate(model, model, [-Bug.#ANT.thorax.x, 0.0, 0.0]);
        mat4.rotateY(model, model, Bug.#ANT.abdomen.angle);
        mat4.translate(model, model, [-Bug.#ANT.abdomen.x, 0.0, 0.0]);
        return model;
    }

    #getFemurModel(i) {
        const model = this.#thoraxModel;
        mat4.rotateZ(model, model, Bug.#ANT.femur.horizontalAngles[i]);
        mat4.rotateX(model, model, Bug.#ANT.femur.verticalAngle);
        return model;
    }

    #getTibiaModel(i) {
        const model = this.#getFemurModel(i);
        mat4.translate(model, model, [0.0, 0.0, Bug.#ANT.femur.height - Bug.#ANT.femur.radius]);
        mat4.rotateX(model, model, Bug.#ANT.tibia.angle);
        mat4.translate(model, model, [0.0, 0.0, -Bug.#ANT.tibia.radius]);
        return model;
    }
}
