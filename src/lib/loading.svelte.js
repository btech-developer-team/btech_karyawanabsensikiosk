/** Indikator proses: dipakai bersamaan oleh beberapa tahap, jadi dihitung, bukan boolean. */
class Loading {
	text = $state('Processing...');
	active = $state(false);

	#counter = 0;

	begin(text = 'Processing...') {
		this.#counter += 1;
		this.text = text;
		this.active = true;
	}

	end() {
		this.#counter = Math.max(0, this.#counter - 1);
		if (this.#counter === 0) this.active = false;
	}

	async wrap(text, task) {
		this.begin(text);
		try {
			return await task();
		} finally {
			this.end();
		}
	}
}

export const loading = new Loading();
