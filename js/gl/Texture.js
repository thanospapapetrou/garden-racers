'use strict';

class Texture {
    static #ERROR_LOADING = (url) => `Error loading texture ${url}`;

    #unit;

    constructor(gl, unit, url) {
        return (async () => {
            const image = await new Promise((resolve) => {
                const image = new Image();
                image.onload = () => resolve(image);
                image.onerror = () => {
                    throw new Error(Texture.#ERROR_LOADING(url));
                };
                image.src = url;
            });
            const texture = gl.createTexture();
            this.#unit = unit;
            gl.activeTexture(this.#unit + gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
            gl.generateMipmap(gl.TEXTURE_2D);
            // TODO unbind and make inactive
            return this;
        })();
    }

    get unit() {
        return this.#unit;
    }
}
