from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = BACKEND_ROOT.parent


def _env_files() -> tuple[str, ...]:
    # Prefer backend/.env, fall back to repo-root .env
    candidates = [BACKEND_ROOT / ".env", REPO_ROOT / ".env"]
    return tuple(str(p) for p in candidates if p.exists())


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=_env_files() or (str(BACKEND_ROOT / ".env"),),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.0-flash"

    deepseek_api_key: str = ""
    deepseek_model: str = "deepseek/deepseek-chat"

    openrouter_api_key: str = ""
    model_name: str = "nvidia/nemotron-3-ultra:free"
    fallback_model_name: str = "deepseek/deepseek-r1:free"
    openrouter_base_url: str = "https://openrouter.ai/api/v1"


    curriculum_path: Path = REPO_ROOT / "curriculum.json"
    candidates_path: Path = REPO_ROOT / "candidates.json"
    chroma_dir: Path = BACKEND_ROOT / ".chroma"
    embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"

    min_questions: int = 8
    min_curriculum_days: int = 4
    retrieval_top_k: int = 6


settings = Settings()
