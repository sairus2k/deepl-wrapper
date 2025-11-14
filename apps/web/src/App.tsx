import { useEffect, useState } from 'react'

interface Language {
	code: string
	name: string
}

interface Languages {
	source: Language[]
	target: Language[]
}

const API_URL = import.meta.env.VITE_API_URL || '/api'

async function fetchLanguages() {
	const response = await fetch(`${API_URL}/languages`)
	return await response.json()
}

function App() {
	const [file, setFile] = useState<File | null>(null)
	const [sourceLang, setSourceLang] = useState<string>('')
	const [targetLang, setTargetLang] = useState<string>('en-US')
	const [languages, setLanguages] = useState<Languages | null>(null)
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string>('')
	const [dragActive, setDragActive] = useState(false)

	useEffect(() => {
		const loadLanguages = async () => {
			try {
				const data = await fetchLanguages()
				setLanguages(data)
			} catch (err) {
				console.error('Failed to fetch languages:', err)
				setError(
					'Failed to load supported languages. Please check your API connection.',
				)
			}
		}
		void loadLanguages()
	}, [])

	const handleDrag = (e: React.DragEvent) => {
		e.preventDefault()
		e.stopPropagation()
		if (e.type === 'dragenter' || e.type === 'dragover') {
			setDragActive(true)
		} else if (e.type === 'dragleave') {
			setDragActive(false)
		}
	}

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault()
		e.stopPropagation()
		setDragActive(false)

		const droppedFile = e.dataTransfer.files?.[0]
		if (droppedFile) {
			setFile(droppedFile)
			setError('')
		}
	}

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault()
			document.getElementById('file-input')?.click()
		}
	}

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const selectedFile = e.target.files?.[0]
		if (selectedFile) {
			setFile(selectedFile)
			setError('')
		}
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!file) {
			setError('Please select a file')
			return
		}

		if (!targetLang) {
			setError('Please select a target language')
			return
		}

		setIsLoading(true)
		setError('')

		try {
			const formData = new FormData()
			formData.append('file', file)
			formData.append('targetLang', targetLang)
			if (sourceLang) {
				formData.append('sourceLang', sourceLang)
			}

			const response = await fetch(`${API_URL}/translate`, {
				method: 'POST',
				body: formData,
			})

			if (!response.ok) {
				const errorData = await response.json()
				throw new Error(errorData.message || 'Translation failed')
			}

			// Download the translated file
			const blob = await response.blob()
			const url = window.URL.createObjectURL(blob)
			const a = document.createElement('a')
			a.href = url

			// Get filename from Content-Disposition header or generate one
			const contentDisposition = response.headers.get('Content-Disposition')
			const filenameMatch = contentDisposition?.match(/filename="(.+)"/)
			a.download = filenameMatch ? filenameMatch[1] : `translated_${file.name}`
			document.body.appendChild(a)
			a.click()
			window.URL.revokeObjectURL(url)
			document.body.removeChild(a)

			// Reset form
			setFile(null)
			const fileInput = document.getElementById(
				'file-input',
			) as HTMLInputElement
			if (fileInput) fileInput.value = ''
		} catch (err: unknown) {
			const errorMessage =
				err instanceof Error
					? err.message
					: 'Translation failed. Please try again.'
			setError(errorMessage)
		} finally {
			setIsLoading(false)
		}
	}

	const supportedFormats = ['TXT', 'HTML', 'XLSX', 'XLIFF', 'SRT']

	return (
		<div className="min-h-screen flex flex-col">
			<header className="text-center py-8 px-4 bg-gradient-to-br from-primary to-secondary text-white shadow-lg">
				<h1 className="text-4xl font-bold mb-2">DeepL File Translator</h1>
				<p className="text-lg opacity-95">Translate files using DeepL API</p>
			</header>

			<main className="flex-1 max-w-3xl w-full mx-auto p-8">
				<div className="card bg-base-100 shadow-xl">
					<div className="card-body">
						<div className="text-center mb-6">
							<p className="text-sm font-medium text-base-content/70 mb-3">
								Supported formats:
							</p>
							<div className="flex gap-2 justify-center flex-wrap">
								{supportedFormats.map((format) => (
									<span key={format} className="badge badge-primary badge-lg">
										{format}
									</span>
								))}
							</div>
						</div>

						<form onSubmit={handleSubmit} className="flex flex-col gap-6">
							<div
								className={`border-2 border-dashed rounded-box p-12 text-center transition-all cursor-pointer ${
									dragActive
										? 'border-primary bg-primary/10 scale-105'
										: file
											? 'border-success bg-success/10'
											: 'border-base-300 bg-base-200 hover:border-primary hover:bg-base-300'
								}`}
								onDragEnter={handleDrag}
								onDragLeave={handleDrag}
								onDragOver={handleDrag}
								onDrop={handleDrop}
								role="button"
								tabIndex={0}
								onKeyDown={handleKeyDown}
							>
								<input
									id="file-input"
									type="file"
									onChange={handleFileChange}
									className="hidden"
									accept=".txt,.html,.xlsx,.xliff,.srt"
								/>
								<label
									htmlFor="file-input"
									className="cursor-pointer flex flex-col gap-2 items-center"
								>
									{file ? (
										<>
											<span className="text-4xl">📄</span>
											<span className="font-semibold text-base-content break-all">
												{file.name}
											</span>
											<span className="text-sm text-base-content/60">
												({(file.size / 1024).toFixed(2)} KB)
											</span>
										</>
									) : (
										<>
											<span className="text-5xl">📁</span>
											<span className="text-base-content/70">
												Drop your file here or click to browse
											</span>
										</>
									)}
								</label>
							</div>

							<div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-4 items-end">
								<div className="form-control">
									<label htmlFor="source-lang" className="label">
										<span className="label-text font-semibold">
											Source Language
										</span>
									</label>
									<select
										id="source-lang"
										value={sourceLang}
										onChange={(e) => setSourceLang(e.target.value)}
										className="select select-bordered w-full"
									>
										<option value="">Auto-detect</option>
										{languages?.source.map((lang) => (
											<option key={lang.code} value={lang.code}>
												{lang.name}
											</option>
										))}
									</select>
								</div>

								<div className="text-2xl text-primary font-bold pb-2 hidden lg:block">
									→
								</div>

								<div className="form-control">
									<label htmlFor="target-lang" className="label">
										<span className="label-text font-semibold">
											Target Language *
										</span>
									</label>
									<select
										id="target-lang"
										value={targetLang}
										onChange={(e) => setTargetLang(e.target.value)}
										className="select select-bordered w-full"
										required
									>
										{languages?.target.map((lang) => (
											<option key={lang.code} value={lang.code}>
												{lang.name}
											</option>
										))}
									</select>
								</div>
							</div>

							{error && (
								<div className="alert alert-error">
									<span>{error}</span>
								</div>
							)}

							<button
								type="submit"
								disabled={isLoading || !file}
								className="btn btn-primary btn-lg"
							>
								{isLoading ? 'Translating...' : 'Translate File'}
							</button>
						</form>
					</div>
				</div>

				<footer className="text-center mt-8 p-4">
					<p className="text-base-content/60">
						Get your free DeepL API key at{' '}
						<a
							href="https://www.deepl.com/pro-api"
							target="_blank"
							rel="noopener noreferrer"
							className="link link-primary font-semibold"
						>
							deepl.com/pro-api
						</a>
					</p>
				</footer>
			</main>
		</div>
	)
}

export default App
