'use strict';

class Ellipsoid {
    #a;
    #b;
    #c;
    #sectors;
    #stacks;

    constructor(a, b, c, sectors, stacks) {
        this.#a = a;
        this.#b = b;
        this.#c = c;
        this.#sectors = sectors;
        this.#stacks = stacks;
    }

    get positions() {
        const positions = [0.0, 0.0, this.#c];
        for (let i = Math.PI / this.#stacks; i < Math.PI; i += Math.PI / this.#stacks) {
            for (let j = 0; j < 2 * Math.PI; j += 2 * Math.PI / this.#sectors) {
                positions.push(this.#a * Math.sin(i) * Math.cos(j),
                        this.#b * Math.sin(i) * Math.sin(j),
                        this.#c * Math.cos(i));
            }
        }
        positions.push(0.0, 0.0, -this.#c);
        return positions;
    }

    get normals() {
        const normals = [0.0, 0.0, 1.0];
        for (let i = Math.PI / this.#stacks; i < Math.PI; i += Math.PI / this.#stacks) {
            for (let j = 0; j < 2 * Math.PI; j += 2 * Math.PI / this.#sectors) {
                normals.push(Math.sin(i) * Math.cos(j),
                        Math.sin(i) * Math.sin(j),
                        Math.cos(i));
            }
        }
        normals.push(0.0, 0.0, -1.0);
        return normals;
    }

    get indices() {
        const indices = [];
        for (let i = 0; i < this.#sectors; i++) {
            indices.push(0, i + 1, (i + 1) % this.#sectors + 1);
        }
        for (let i = 0; i < this.#stacks - 2; i++) {
            for (let j = 0; j < this.#sectors; j++) {
                indices.push(i * this.#sectors + j + 1,
                        (i + 1) * this.#sectors + j + 1,
                        (i + 1) * this.#sectors + (j + 1) % this.#sectors + 1);
                indices.push((i + 1) * this.#sectors + (j + 1) % this.#sectors + 1,
                        i * this.#sectors + (j + 1) % this.#sectors + 1,
                        i * this.#sectors + j + 1);
            }
        }
        for (let i = 0; i < this.#sectors; i++) {
            indices.push((this.#stacks - 2) * this.#sectors + i + 1,
                    (this.#stacks - 1) * this.#sectors + 1,
                    (this.#stacks - 2) * this.#sectors + (i + 1) % this.#sectors + 1);
        }
        return indices;
    }
}
