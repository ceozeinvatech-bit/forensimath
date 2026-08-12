from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import cases, evidence, scenarios, analysis
from .database import get_db

app = FastAPI(title='ForensiMath API')

import os

FRONTEND_ORIGINS = os.getenv('FRONTEND_ORIGINS')
if FRONTEND_ORIGINS:
    origins = [o.strip() for o in FRONTEND_ORIGINS.split(',') if o.strip()]
else:
    # during development allow common local origins
    origins = ['https://forensicmaths.onrender.com', 'http://127.0.0.1:5173']

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)


@app.get('/api/health')
def health():
    return {'status': 'ok'}


app.include_router(cases.router, prefix='/api/cases')
app.include_router(evidence.router, prefix='/api')
app.include_router(scenarios.router, prefix='/api')
app.include_router(analysis.router, prefix='/api')
