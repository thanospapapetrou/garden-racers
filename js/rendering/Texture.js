'use strict';

class Texture {
    static #ERROR_LOADING = (url) => `Error loading ${url}`;

    #texture;

    constructor(gl, url) {
        return (async () => {
            const image = await new Promise((resolve) => {
                const image = new Image();
                image.onload = () => resolve(image);
                image.onerror = () => {
                    throw new Error(Texture.#ERROR_LOADING(url)); // TODO rejections
                };
                image.src = url;
            });
            gl.activeTexture(gl.TEXTURE0);
            this.#texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, this.#texture); // TODO unbound texture
//            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            // TODO
//                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
//                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
//                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,gl.UNSIGNED_BYTE, image);
            gl.generateMipmap(gl.TEXTURE_2D);
//            gl.activeTexture(gl.TEXTURE2);
            return this;
        })();
    }

    get texture() {
        return this.#texture;
    }
}
