'use strict';

class Renderer {
    static #DELIMITER = '.';
    static #ERROR_COMPILING = (type, url, info) => `Error compiling ${(type == WebGLRenderingContext.VERTEX_SHADER) ? 'vertex' : 'fragment'} shader ${url}: ${info}`;
    static #ERROR_LINKING = (vertex, fragment, info) => `Error linking program (${vertex}, ${fragment}): ${info}`;
    static #TYPE_FUNCTION = 'function';

    #gl;
    #program;
    #uniforms;
    #attributes;

    constructor(gl, vertex, fragment, uniforms, attributes) {
        this.#gl = gl;
        return (async () => {
            this.#program = await this.#link(vertex, fragment);
            this.#uniforms = this.#resolveUniforms('', uniforms);
            this.#resolveAttributes(attributes);
            return this;
        })();
    }

    get program() {
        return this.#program;
    }

    get uniforms() {
        return this.#uniforms;
    }

    get attributes() {
        return this.#attributes;
    }

    async #link(vertex, fragment) {
        const program = this.#gl.createProgram();
        this.#gl.attachShader(program, await this.#compile(vertex, this.#gl.VERTEX_SHADER));
        this.#gl.attachShader(program, await this.#compile(fragment, this.#gl.FRAGMENT_SHADER));
        this.#gl.linkProgram(program);
        if (!this.#gl.getProgramParameter(program, this.#gl.LINK_STATUS)) {
            const info = this.#gl.getProgramInfoLog(program);
            this.#gl.deleteProgram(program);
            throw new Error(Renderer.#ERROR_LINKING(vertex, fragment, info));
        }
        return program;
    }

    async #compile(url, type) {
        const shader = this.#gl.createShader(type);
        this.#gl.shaderSource(shader, await (await GardenRacers.load(url)).text());
        this.#gl.compileShader(shader);
        if (!this.#gl.getShaderParameter(shader, this.#gl.COMPILE_STATUS)) {
            const info = this.#gl.getShaderInfoLog(shader);
            this.#gl.deleteShader(shader);
            throw new Error(Renderer.#ERROR_COMPILING(type, url, info))
        }
        return shader;
    }

    #resolveUniforms(prefix, uniforms) {
        const result = {};
        const gl = this.#gl;
        const program = this.#program;
        for (let uniform of Object.keys(uniforms)) {
            const setter = uniforms[uniform];
            if (typeof setter == Renderer.#TYPE_FUNCTION) {
                const location = this.#gl.getUniformLocation(this.#program, prefix + uniform);
                Object.defineProperty(result, uniform, {
                    set(value) {
                        gl.useProgram(program);
                        setter(gl, location, value);
                    }
                });
            } else {
                result[uniform] = this.#resolveUniforms(prefix + uniform + Renderer.#DELIMITER, setter);
            }
        }
        return result;
    }

    #resolveAttributes(attributes) {
        this.#attributes = {};
        const gl = this.#gl;
        for (let attribute of attributes) {
            const location = this.#gl.getAttribLocation(this.#program, attribute);
            Object.defineProperty(this.#attributes, attribute, {
                set(data) {
                    gl.bindBuffer(gl.ARRAY_BUFFER, data.buffer);
                    gl.vertexAttribPointer(location, Vector.COMPONENTS, gl.FLOAT, false, 0, 0);
                    gl.enableVertexAttribArray(location);
                    gl.bindBuffer(gl.ARRAY_BUFFER, null);
                }
            });
        }
    }
}
