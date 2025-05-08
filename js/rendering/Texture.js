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
            this.#texture = gl.createTexture();
            gl.activeTexture(gl.TEXTURE0 + 0);
            gl.bindTexture(gl.TEXTURE_2D, this.#texture); // TODO unbound texture
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,gl.UNSIGNED_BYTE, image);
            gl.generateMipmap(gl.TEXTURE_2D);
            return this;
        })();
    }

    get texture() {
        return this.#texture;
    }
}
