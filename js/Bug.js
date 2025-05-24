'use strict';

class Bug {
    static #ATTRIBUTES = ['position'];
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

    #task;

    constructor(gl) {
        return (async () => {
            const renderer = await new Renderer(gl, Bug.#SHADER_VERTEX, Bug.#SHADER_FRAGMENT, Bug.#UNIFORMS,
                    Bug.#ATTRIBUTES);
            this.#task = new RenderingTask(gl, renderer, {
                position: new AttributeData(gl, this.#positions)
            }, new IndexData(gl, this.#indices));
            return this;
        })();
    }

    render(projection, camera, model, light) {
        this.#task.render({projection, camera, model, light}); // TODO do not set all here
    }

    get #positions() {
        return [
            0.0, 0.0, 1.0,
            0.0, 1.0, 1.0,
            1.0, 1.0, 1.0,
            1.0, 0.0, 1.0
        ];
    }

    get #indices() {
        return [0, 1, 2, 2, 3, 0];
    }
}
