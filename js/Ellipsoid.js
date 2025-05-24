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
        for (let i = 1; i < this.#stacks; i++) {
            const theta = i * Math.PI / this.#stacks;
            for (let j = 0; j < this.#sectors; j++) {
                const phi = j * 2 * Math.PI / this.#sectors;
                const x = this.#a * Math.sin(theta) * Math.cos(phi);
                const y = this.#b * Math.sin(theta) * Math.sin(phi);
                const z = this.#c * Math.cos(theta);
                positions.push(x, y, z);
            }
        }
        positions.push(0.0, 0.0, -this.#c);
        return positions;
    }

    get normals() {
        const normals = [0.0, 0.0, 1.0];
        for (let i = 1; i < this.#stacks; i++) {
            const theta = i * Math.PI / this.#stacks;
            for (let j = 0; j < this.#sectors; j++) {
                const phi = j * 2 * Math.PI / this.#sectors;
                const x = Math.sin(theta) * Math.cos(phi);
                const y = Math.sin(theta) * Math.sin(phi);
                const z = Math.cos(theta);
                normals.push(x, y, z);
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
                indices.push(i * this.#sectors + j + 1, (i + 1) * this.#sectors + j + 1,
                        (i + 1) * this.#sectors + (j + 1) % this.#sectors + 1);
                indices.push((i + 1) * this.#sectors + (j + 1) % this.#sectors + 1,
                        i * this.#sectors + (j + 1) % this.#sectors + 1,
                        i * this.#sectors + j + 1);
            }
        }
        for (let i = 0; i < this.#sectors; i++) {
            indices.push((this.#stacks - 2) * this.#sectors + i + 1, (this.#stacks - 1) * this.#sectors + 1,
                    (this.#stacks - 2) * this.#sectors + (i + 1) % this.#sectors + 1);
        }
        return indices;
    }
}
