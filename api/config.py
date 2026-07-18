# ============================================================
# SHB-AgentOS: Python Backend Configuration
# ============================================================

import os
from dotenv import load_dotenv
from pathlib import Path

# Load .env.local from project root
_project_root = Path(__file__).parent.parent
load_dotenv(dotenv_path=_project_root / '.env.local')

# Supabase
SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL', '')
SUPABASE_ANON_KEY = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '')
SUPABASE_SERVICE_ROLE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY', '')

# OpenAI
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', '')
OPENAI_MODEL = os.getenv('OPENAI_MODEL', 'gpt-4.1-nano')

# Jina AI Embeddings
JINA_API_KEY = os.getenv('JINA_API_KEY', '')
JINA_EMBEDDING_MODEL = os.getenv('JINA_EMBEDDING_MODEL', 'jina-embeddings-v3')
EMBEDDING_PROVIDER = os.getenv('EMBEDDING_PROVIDER', 'jina')
