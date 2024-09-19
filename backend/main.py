from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.staticfiles import StaticFiles
from starlette.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI
import os
from dotenv import load_dotenv
import pandas as pd

# python -m uvicorn backend.main:app --reload

# Load environment variables from .env file
load_dotenv()

app = FastAPI()

# Global DataFrame variable to store the uploaded dataset
global_df = pd.DataFrame()

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
    api_key=os.environ.get("OPENAI_API_KEY")
)

# Define request and response models
class QueryRequest(BaseModel):
    prompt: str

class QueryResponse(BaseModel):
    response: str


def text_response(prompt):
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}]
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        return f"Error querying OpenAI: {e}"

def graph_response(prompt):
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}]
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        return f"Error querying OpenAI: {e}"

# Endpoint to interact with OpenAI API
@app.post("/query", response_model=QueryResponse)
async def query_openai(request: QueryRequest):
    global global_df  # Access the global DataFrame

    if global_df.empty:
        return QueryResponse(response="No dataset uploaded yet.")

    # Create a prompt using the dataset
    columns = global_df.columns.tolist()
    prompt = f"Is the following prompt relevant to data analysis of a dataset with these columns: {columns}? Be lenient.\nRespond with just 'yes' or 'no'.\n\nHere is the prompt: {request.prompt}"
    print(prompt)
    try:
        # Initial query to check relevance
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}]
        )
        response_text = response.choices[0].message.content.strip()
        
        if "yes" in response_text.lower():
            data_prompt = f"Does the following prompt require producing a graph? \nRespond with just 'yes' or 'no'\n\nPrompt: {request.prompt}"
            response_text = text_response(data_prompt)
            if "yes" in response_text.lower():
                #response_text = graph_response(request.prompt)
                response_text = f"Graph produced for the prompt"
            else:
                data_prompt = f"Given the dataset below, answer the following question: {request.prompt}\n\nDataset:\n{global_df.to_string(index=False)}"
                response_text = text_response(data_prompt)
        else:
            response_text = f"The question \"{request.prompt}\" is not relevant to the dataset."

        return QueryResponse(response=response_text)

    except Exception as e:
        return QueryResponse(response=f"Error querying OpenAI: {e}")

# Endpoint to handle file uploads
@app.post("/uploadfile/")
async def upload_file(file: UploadFile = File(...)):
    global global_df  # Access the global DataFrame
    try:
        # Read the uploaded file as a pandas DataFrame
        global_df = pd.read_csv(file.file)

        # Get the title of the first column
        first_column_title = global_df.columns[0]

        # Print "file received" and the first column title
        print(f"File received. First column title: {first_column_title}")

        # Return a response with a message and the first column title
        return {"message": f"File received, first_column_title: {first_column_title}"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing file: {e}")

# Serve React static files
app.mount("/", StaticFiles(directory="client/build", html=True), name="static")

# Custom 404 handler for React routes
@app.get("/{path_name:path}")
async def serve_react(path_name: str):
    return FileResponse("client/build/index.html")
