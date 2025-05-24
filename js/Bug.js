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
        const sectors = 8;
        const slices = 4;
        const a = 3;
        const b = 4;
        const c = 5;
        const positions = [0.0, 0.0, c];
        for (let i = 1; i < slices; i++) {
            const theta = i * Math.PI / slices;
            for (let j = 0; j < sectors; j++) {
                const phi = j * 2 * Math.PI / sectors;
                const x = a * Math.sin(theta) * Math.cos(phi);
                const y = b * Math.sin(theta) * Math.sin(phi);
                const z = c * Math.cos(theta);
                positions.push(x, y, z);
            }
        }
        positions.push(0.0, 0.0, -c);
        return positions;
    }

    get #indices() {
        const sectors = 8;
        const slices = 4;
        const indices = [];
        for (let i = 0; i < sectors; i++) {
            indices.push(0, i + 1, (i + 1) % sectors + 1);
        }
        for (let i = 0; i < slices - 2; i++) {
            for (let j = 0; j < sectors; j++) {
                indices.push(i * sectors + j + 1, (i + 1) * sectors + j + 1,
                        (i + 1) * sectors + (j + 1) % sectors + 1);
                indices.push((i + 1) * sectors + (j + 1) % sectors + 1, i * sectors + (j + 1) % sectors + 1,
                        i * sectors + j + 1);
            }
        }
        for (let i = 0; i < sectors; i++) {
            indices.push((slices - 2) * sectors + i + 1, (slices - 1) * sectors + 2,
                    (slices - 2) * sectors + (i + 1) % sectors + 1);
        }
        return indices;
    }
}
