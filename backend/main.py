from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from starlette.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI
import os
from dotenv import load_dotenv

# python -m uvicorn backend.main:app --reload

# Load environment variables from .env file
load_dotenv()

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this to restrict allowed origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure OpenAI API key
client = OpenAI(
    # defaults to os.environ.get("OPENAI_API_KEY")
    api_key=os.environ.get("OPENAI_API_KEY")
)

# Define request and response models
class QueryRequest(BaseModel):
    prompt: str

class QueryResponse(BaseModel):
    response: str

# Endpoint to interact with OpenAI API
@app.post("/query", response_model=QueryResponse)
async def query_openai(request: QueryRequest):
    prompt = "Is the following question relevant to data analysis of an uplaoded dataset? Respond with just 'yes' or 'no'.\n\n Here is the question:" + request.prompt
    try:
        response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": prompt}]
        )
        response_text = response.choices[0].message.content.strip()
        if "yes" in response_text.lower():
            response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": request.prompt}]
            )
            response_text = response.choices[0].message.content.strip()
        else:
            response_text = f"The question \"{request.prompt}\" is not relevant to the dataset. It does not pertain to any data analysis or visualization tasks."
        
        return QueryResponse(response=response_text)
    except:
        return QueryResponse(response="I’m a simple bot. I don’t have real responses yet!")

# Serve React static files
app.mount("/", StaticFiles(directory="client/build", html=True), name="static")

# Custom 404 handler for React routes
@app.get("/{path_name:path}")
async def serve_react(path_name: str):
    return FileResponse("client/build/index.html")