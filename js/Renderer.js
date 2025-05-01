'use strict';

class Renderer {
    static #DELIMITER = '.';
    static #ERROR_COMPILING = (type, url, info) => `Error compiling ${(type == WebGLRenderingContext.VERTEX_SHADER) ? 'vertex' : 'fragment'} shader ${url}: ${info}`;
    static #ERROR_LINKING = (vertex, fragment, info) => `Error linking program (${vertex}, ${fragment}): ${info}`;
    static #ERROR_LOADING = (url, status) => `Error loading ${url}: HTTP status ${status}`;
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
        this.#gl.shaderSource(shader, await this.#load(url));
        this.#gl.compileShader(shader);
        if (!this.#gl.getShaderParameter(shader, this.#gl.COMPILE_STATUS)) {
            const info = this.#gl.getShaderInfoLog(shader);
            this.#gl.deleteShader(shader);
            throw new Error(Renderer.#ERROR_COMPILING(type, url, info))
        }
        return shader;
    }

    async #load(url) {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(Carousel.#ERROR_LOADING(url, response.status));
        }
        return response.text();
    }

    #resolveUniforms(prefix, uniforms) {
        const result = {};
        const gl = this.#gl;
        for (let uniform of Object.keys(uniforms)) {
            const setter = uniforms[uniform];
            if (typeof setter == Renderer.#TYPE_FUNCTION) {
                const location = this.#gl.getUniformLocation(this.#program, prefix + uniform);
                Object.defineProperty(result, uniform, {
                    set(value) {
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
        for (let attribute of attributes) {
            this.#attributes[attribute] = this.#gl.getAttribLocation(this.#program, attribute);
        }
    }
}
