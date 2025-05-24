'use strict';

class Bug {
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

    #task;

    constructor(gl) {
        return (async () => {
            const renderer = await new Renderer(gl, Bug.#SHADER_VERTEX, Bug.#SHADER_FRAGMENT, Bug.#UNIFORMS,
                    Bug.#ATTRIBUTES);
            const bug = new Ellipsoid(0.1, 0.1, 1.0, 16, 8);
            this.#task = new RenderingTask(gl, renderer, {
                position: new AttributeData(gl, bug.positions),
                normal: new AttributeData(gl, bug.normals)
            }, new IndexData(gl, bug.indices));
            return this;
        })();
    }

    render(projection, camera, model, light) {
        this.#task.render({projection, camera, model, light}); // TODO do not set all here
    }
}
