'use strict';

class DataTexture {
    #unit;

    constructor(gl, unit, data) {
        this.#unit = unit;
        const texture = gl.createTexture();
        gl.activeTexture(this.#unit);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32I, data.length, 1, 0, gl.RED_INTEGER, gl.INT, new Int32Array(data));
    }

    get unit() {
        return this.#unit;
    }
}
