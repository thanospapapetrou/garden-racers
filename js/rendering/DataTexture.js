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
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB32F, data.length / Vector.COMPONENTS, 1, 0, gl.RGB, gl.FLOAT,
                new Float32Array(data));
    }

    get unit() {
        return this.#unit;
    }
}
