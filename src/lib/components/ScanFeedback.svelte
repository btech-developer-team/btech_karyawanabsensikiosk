<script>
	import { DEFAULT_AVATAR } from '$lib/config.js';

	let { feedback = null } = $props();
</script>

{#if feedback}
	<div class="feedback-backdrop">
		<div class="card feedback-card {feedback.type === 'success' ? 'border-success' : 'border-danger'}">
			<div
				class="card-header text-white {feedback.type === 'success' ? 'bg-success' : 'bg-danger'}"
			>
				{feedback.type === 'success' ? 'Absensi tercatat' : 'Gagal'}
			</div>
			<div class="card-body text-center">
				<img class="avatar mb-2" src={feedback.avatar || DEFAULT_AVATAR} alt="" />
				<p class="fw-bold mb-1">{feedback.nama ?? '-'}</p>
				<p class="mb-1">{feedback.message}</p>
				<p class="small text-muted mb-0">{feedback.at}</p>
			</div>
		</div>
	</div>
{/if}

<style>
	.feedback-backdrop {
		position: fixed;
		inset: 0;
		z-index: 1090;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(0, 0, 0, 0.45);
	}

	.feedback-card {
		width: min(22rem, 90vw);
		border-width: 2px;
	}

	.avatar {
		width: 80px;
		height: 80px;
		object-fit: cover;
		border-radius: 50%;
	}
</style>
