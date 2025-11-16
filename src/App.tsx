import { useEffect, useState } from 'react'

interface Language {
	code: string
	name: string
}

interface Languages {
	source: Language[]
	target: Language[]
}

interface UsageData {
	characterCount: number
	characterLimit: number
}

const API_URL = import.meta.env.VITE_API_URL || '/api'
const STORAGE_KEY = 'deepl_api_key'

async function fetchLanguages(apiKey: string) {
	const headers: HeadersInit = {
		'X-DeepL-API-Key': apiKey,
	}
	const response = await fetch(`${API_URL}/languages`, { headers })
	return await response.json()
}

async function fetchUsage(apiKey: string): Promise<UsageData> {
	const headers: HeadersInit = {
		'X-DeepL-API-Key': apiKey,
	}
	const response = await fetch(`${API_URL}/usage`, { headers })
	if (!response.ok) {
		const errorData = await response.json()
		throw new Error(errorData.message || 'Failed to fetch usage data')
	}
	return await response.json()
}

function App() {
	const [file, setFile] = useState<File | null>(null)
	const [sourceLang, setSourceLang] = useState<string>('')
	const [targetLang, setTargetLang] = useState<string>('en-US')
	const [languages, setLanguages] = useState<Languages | null>(null)
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string>('')
	const [apiKey, setApiKey] = useState<string>('')
	const [showApiKeyInput, setShowApiKeyInput] = useState(false)
	const [usageData, setUsageData] = useState<UsageData | null>(null)
	const [usageError, setUsageError] = useState<string>('')
	const [isLoadingUsage, setIsLoadingUsage] = useState(false)

	// Load API key from localStorage on mount
	useEffect(() => {
		const storedKey = localStorage.getItem(STORAGE_KEY)
		if (storedKey) {
			setApiKey(storedKey)
		} else {
			setShowApiKeyInput(true)
		}
	}, [])

	useEffect(() => {
		const loadLanguages = async () => {
			// Skip loading if we don't have an API key
			if (!apiKey) {
				return
			}

			try {
				const data = await fetchLanguages(apiKey)
				setLanguages(data)
			} catch (err) {
				console.error('Failed to fetch languages:', err)
				setError(
					'Failed to load supported languages. Please check your API key and connection.',
				)
			}
		}
		void loadLanguages()
	}, [apiKey])

	useEffect(() => {
		const loadUsage = async () => {
			// Skip loading if we don't have an API key or if API key input is shown
			if (!apiKey || showApiKeyInput) {
				return
			}

			setIsLoadingUsage(true)
			setUsageError('')

			try {
				const data = await fetchUsage(apiKey)
				setUsageData(data)
			} catch (err) {
				console.error('Failed to fetch usage data:', err)
				setUsageError(
					err instanceof Error ? err.message : 'Failed to load usage data',
				)
			} finally {
				setIsLoadingUsage(false)
			}
		}
		void loadUsage()
	}, [apiKey, showApiKeyInput])

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const selectedFile = e.target.files?.[0]
		if (selectedFile) {
			setFile(selectedFile)
			setError('')
		}
	}

	const handleApiKeySubmit = (e: React.FormEvent) => {
		e.preventDefault()
		if (apiKey.trim()) {
			localStorage.setItem(STORAGE_KEY, apiKey.trim())
			setShowApiKeyInput(false)
			setError('')
		} else {
			setError('Please enter a valid API key')
		}
	}

	const handleApiKeyChange = () => {
		setShowApiKeyInput(true)
	}

	const handleApiKeyClear = () => {
		localStorage.removeItem(STORAGE_KEY)
		setApiKey('')
		setShowApiKeyInput(true)
		setLanguages(null)
		setUsageData(null)
	}

	const refreshUsage = async () => {
		if (!apiKey) {
			return
		}

		setIsLoadingUsage(true)
		setUsageError('')

		try {
			const data = await fetchUsage(apiKey)
			setUsageData(data)
		} catch (err) {
			console.error('Failed to fetch usage data:', err)
			setUsageError(
				err instanceof Error ? err.message : 'Failed to load usage data',
			)
		} finally {
			setIsLoadingUsage(false)
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

			const headers: HeadersInit = {
				'X-DeepL-API-Key': apiKey,
			}

			const response = await fetch(`${API_URL}/translate`, {
				method: 'POST',
				headers,
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

			// Refresh usage statistics after successful translation
			void refreshUsage()
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
				{showApiKeyInput && (
					<div className="card bg-base-100 shadow-xl mb-6">
						<div className="card-body">
							<h2 className="card-title text-2xl mb-4">
								DeepL API Key Required
							</h2>
							<p className="text-base-content/70 mb-4">
								Please enter your DeepL API key to use the translation service.
								Your key will be stored locally in your browser.
							</p>
							<form
								onSubmit={handleApiKeySubmit}
								className="flex flex-col gap-4"
							>
								<div className="form-control">
									<input
										type="text"
										value={apiKey}
										onChange={(e) => setApiKey(e.target.value)}
										placeholder="Enter your DeepL API key"
										className="input input-bordered input-primary w-full"
									/>
								</div>
								{error && (
									<div className="alert alert-error">
										<span>{error}</span>
									</div>
								)}
								<button type="submit" className="btn btn-primary">
									Save API Key
								</button>
								<p className="text-sm text-base-content/60">
									Don't have an API key?{' '}
									<a
										href="https://www.deepl.com/pro-api"
										target="_blank"
										rel="noopener noreferrer"
										className="link link-primary font-semibold"
									>
										Get one for free at deepl.com/pro-api
									</a>
								</p>
							</form>
						</div>
					</div>
				)}

				{!showApiKeyInput && apiKey && (
					<>
						<div className="alert mb-6 shadow-lg">
							<div className="flex-1">
								<span>API key configured</span>
							</div>
							<div className="flex gap-2">
								<button
									type="button"
									onClick={handleApiKeyChange}
									className="btn btn-sm btn-ghost"
								>
									Change
								</button>
								<button
									type="button"
									onClick={handleApiKeyClear}
									className="btn btn-sm btn-ghost"
								>
									Clear
								</button>
							</div>
						</div>

						{/* Usage Statistics Card */}
						<div className="card bg-base-100 shadow-xl mb-6">
							<div className="card-body">
								<div className="flex justify-between items-center mb-4">
									<h2 className="card-title text-xl">API Usage Statistics</h2>
									<button
										type="button"
										onClick={refreshUsage}
										disabled={isLoadingUsage}
										className="btn btn-sm btn-ghost"
										title="Refresh usage statistics"
									>
										<svg
											role="graphics-symbol"
											xmlns="http://www.w3.org/2000/svg"
											fill="none"
											viewBox="0 0 24 24"
											strokeWidth={2}
											stroke="currentColor"
											className={`w-4 h-4 ${isLoadingUsage ? 'animate-spin' : ''}`}
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
											/>
										</svg>
									</button>
								</div>

								{isLoadingUsage && (
									<div className="flex justify-center py-4">
										<span className="loading loading-spinner loading-lg text-primary" />
									</div>
								)}

								{usageError && !isLoadingUsage && (
									<div className="alert alert-error">
										<span>{usageError}</span>
									</div>
								)}

								{usageData && !isLoadingUsage && (
									<div>
										<div className="flex justify-between items-center mb-2">
											<span className="text-sm font-semibold">
												Character Usage
											</span>
											<span className="text-sm font-mono">
												{usageData.characterCount.toLocaleString()} /{' '}
												{usageData.characterLimit.toLocaleString()}
											</span>
										</div>
										<progress
											className="progress progress-primary w-full"
											value={usageData.characterCount}
											max={usageData.characterLimit}
										/>
										<div className="text-xs text-base-content/60 mt-1">
											{(
												(usageData.characterCount / usageData.characterLimit) *
												100
											).toFixed(1)}
											% used
										</div>
									</div>
								)}
							</div>
						</div>
					</>
				)}

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
							<div className="form-control">
								<label htmlFor="file-input" className="label">
									<span className="label-text font-semibold">Select File</span>
								</label>
								<input
									id="file-input"
									type="file"
									onChange={handleFileChange}
									className="file-input file-input-bordered file-input-primary w-full"
									accept=".doc,.docx,.pdf,.pptx,.txt,.html,.xlsx,.xliff,.srt"
								/>
								{file && (
									<div className="label">
										<span className="label-text-alt">
											{file.name} ({(file.size / 1024).toFixed(2)} KB)
										</span>
									</div>
								)}
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
			</main>

			<footer className="footer footer-center p-4 bg-base-200 text-base-content border-t">
				<div>
					<p>
						<a
							href="https://github.com/sairus2k/deepl-wrapper"
							target="_blank"
							rel="noopener noreferrer"
							className="link link-hover"
						>
							View on GitHub
						</a>
					</p>
				</div>
			</footer>
		</div>
	)
}

export default App
