'use strict';

class Shader {
    static #ERROR_COMPILING = (type, url, info) => `Error compiling ${Shader.#TYPE(type)} shader ${url}: ${info}`;
    static #ERROR_LOADING = (type, url, status) => `Error loading ${Shader.#TYPE(type)} shader ${url}: HTTP status ${status}`;
    static #TYPE = (type) => (type == WebGLRenderingContext.VERTEX_SHADER) ? 'vertex' : 'fragment';

    #shader;

    constructor(gl, type, url) {
        this.#shader = gl.createShader(type);
        return (async () => {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(Shader.#ERROR_LOADING(type, url, response.status));
            }
            gl.shaderSource(this.#shader, await response.text());
            gl.compileShader(this.#shader);
            if (!gl.getShaderParameter(this.#shader, gl.COMPILE_STATUS)) {
                const info = gl.getShaderInfoLog(this.#shader);
                gl.deleteShader(this.#shader);
                throw new Error(Shader.#ERROR_COMPILING(type, url, info));
            }
            this.toString = () => url;
            return this;
        })();
    }

    get shader() {
        return this.#shader;
    }
}
