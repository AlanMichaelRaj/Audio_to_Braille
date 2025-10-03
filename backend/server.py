from fastapi import FastAPI, UploadFile, File, HTTPException
import requests
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Hugging Face API setup
HF_API_KEY = ""
HF_MODEL = "openai/whisper-small"
API_URL = "https://api-inference.huggingface.co/models/openai/whisper-small"
headers = {"Authorization": f"Bearer {HF_API_KEY}"}


@app.get("/")
def root():
    return {"message": "Server is running!"}


@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    if not file:
        logger.warning("No file uploaded")
        raise HTTPException(status_code=400, detail="No file uploaded")

    try:
        audio_bytes = await file.read()
        if len(audio_bytes) == 0:
            logger.warning("Uploaded file is empty")
            raise HTTPException(status_code=400, detail="Uploaded file is empty")

        logger.info(f"Sending file '{file.filename}' to Hugging Face API...")

        response = requests.post(
            API_URL,
            headers=headers,
            files={"file": (file.filename, audio_bytes, file.content_type)},
            timeout=60  # set a timeout to avoid hanging
        )

        if response.status_code == 404:
            logger.error(f"Model not found: {HF_MODEL}")
            raise HTTPException(status_code=404, detail=f"Hugging Face model '{HF_MODEL}' not found")

        elif response.status_code == 401:
            logger.error("Authentication failed. Check your API token")
            raise HTTPException(status_code=401, detail="Authentication failed with Hugging Face API")

        elif response.status_code != 200:
            logger.error(f"Hugging Face API returned {response.status_code}: {response.text}")
            raise HTTPException(status_code=response.status_code, detail=response.text)

        result = response.json()
        logger.info("Transcription successful")
        return result

    except requests.exceptions.Timeout:
        logger.error("Request to Hugging Face API timed out")
        raise HTTPException(status_code=504, detail="Request timed out")

    except requests.exceptions.RequestException as e:
        logger.exception("Request to Hugging Face API failed")
        raise HTTPException(status_code=500, detail=str(e))

    except Exception as e:
        logger.exception("Unexpected server error")
        raise HTTPException(status_code=500, detail=str(e))
