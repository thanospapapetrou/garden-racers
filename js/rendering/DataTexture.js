'use strict';

class DataTexture {
    #unit;

    constructor(gl, unit, data) {
        this.#unit = unit;
        const texture = gl.createTexture();
        gl.activeTexture(this.#unit);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB32F, data.length / Vector.COMPONENTS, 1, 0, gl.RGB, gl.FLOAT,
                new Float32Array(data));
    }

    get unit() {
        return this.#unit;
    }
}
