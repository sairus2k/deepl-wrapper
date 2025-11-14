import { useEffect, useState } from 'react'
import './App.css'

interface Language {
	code: string
	name: string
}

interface Languages {
	source: Language[]
	target: Language[]
}

const API_URL = import.meta.env.VITE_API_URL || '/api'

function App() {
	const [file, setFile] = useState<File | null>(null)
	const [sourceLang, setSourceLang] = useState<string>('')
	const [targetLang, setTargetLang] = useState<string>('en-US')
	const [languages, setLanguages] = useState<Languages | null>(null)
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string>('')
	const [dragActive, setDragActive] = useState(false)

	useEffect(() => {
		fetchLanguages()
	}, [])

	const fetchLanguages = async () => {
		try {
			const response = await fetch(`${API_URL}/languages`)
			const data = await response.json()
			setLanguages(data)
		} catch (err) {
			console.error('Failed to fetch languages:', err)
			setError(
				'Failed to load supported languages. Please check your API connection.',
			)
		}
	}

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

		if (e.dataTransfer.files && e.dataTransfer.files[0]) {
			setFile(e.dataTransfer.files[0])
			setError('')
		}
	}

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files[0]) {
			setFile(e.target.files[0])
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
			const filename = filenameMatch
				? filenameMatch[1]
				: `translated_${file.name}`

			a.download = filename
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
		} catch (err: any) {
			setError(err.message || 'Translation failed. Please try again.')
		} finally {
			setIsLoading(false)
		}
	}

	const supportedFormats = ['TXT', 'HTML', 'XLSX', 'XLIFF', 'SRT']

	return (
		<div className="app">
			<header className="header">
				<h1>DeepL File Translator</h1>
				<p className="subtitle">Translate files using DeepL API</p>
			</header>

			<main className="main">
				<div className="card">
					<div className="formats">
						<p className="formats-label">Supported formats:</p>
						<div className="format-badges">
							{supportedFormats.map((format) => (
								<span key={format} className="format-badge">
									{format}
								</span>
							))}
						</div>
					</div>

					<form onSubmit={handleSubmit} className="form">
						<div
							className={`file-drop-zone ${dragActive ? 'drag-active' : ''} ${file ? 'has-file' : ''}`}
							onDragEnter={handleDrag}
							onDragLeave={handleDrag}
							onDragOver={handleDrag}
							onDrop={handleDrop}
						>
							<input
								id="file-input"
								type="file"
								onChange={handleFileChange}
								className="file-input"
								accept=".txt,.html,.xlsx,.xliff,.srt"
							/>
							<label htmlFor="file-input" className="file-label">
								{file ? (
									<>
										<span className="file-icon">📄</span>
										<span className="file-name">{file.name}</span>
										<span className="file-size">
											({(file.size / 1024).toFixed(2)} KB)
										</span>
									</>
								) : (
									<>
										<span className="upload-icon">📁</span>
										<span>Drop your file here or click to browse</span>
									</>
								)}
							</label>
						</div>

						<div className="language-selectors">
							<div className="language-group">
								<label htmlFor="source-lang">Source Language</label>
								<select
									id="source-lang"
									value={sourceLang}
									onChange={(e) => setSourceLang(e.target.value)}
									className="language-select"
								>
									<option value="">Auto-detect</option>
									{languages?.source.map((lang) => (
										<option key={lang.code} value={lang.code}>
											{lang.name}
										</option>
									))}
								</select>
							</div>

							<div className="arrow">→</div>

							<div className="language-group">
								<label htmlFor="target-lang">Target Language *</label>
								<select
									id="target-lang"
									value={targetLang}
									onChange={(e) => setTargetLang(e.target.value)}
									className="language-select"
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

						{error && <div className="error-message">{error}</div>}

						<button
							type="submit"
							disabled={isLoading || !file}
							className="submit-button"
						>
							{isLoading ? 'Translating...' : 'Translate File'}
						</button>
					</form>
				</div>

				<footer className="footer">
					<p>
						Get your free DeepL API key at{' '}
						<a
							href="https://www.deepl.com/pro-api"
							target="_blank"
							rel="noopener noreferrer"
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
