import requests
from pathlib import Path

API_URL = "http://127.0.0.1:8000"

USERNAME = "admin"
PASSWORD = "rockfall@123"

IMAGE_DIR = Path(r"C:\RockfallAI\dataset\test\class1")

# Find the image automatically
files = list(IMAGE_DIR.glob("Drone_inspecting_open-pit_mine*202608192240_7*"))

if not files:
    print("ERROR: Image not found.")
    print("Files available in folder:")
    for f in IMAGE_DIR.iterdir():
        print(f.name)
    raise SystemExit

image_path = files[0]

print("Using image:")
print(image_path)
print()

# Login
login_response = requests.post(
    f"{API_URL}/auth/login",
    json={
        "username": USERNAME,
        "password": PASSWORD
    }
)

print("Login status:", login_response.status_code)

if login_response.status_code != 200:
    print(login_response.text)
    raise SystemExit

token = login_response.json()["access_token"]

# Upload image
headers = {
    "Authorization": f"Bearer {token}"
}

with open(image_path, "rb") as image_file:
    upload_response = requests.post(
        f"{API_URL}/drone/image",
        headers=headers,
        files={
            "file": (
                image_path.name,
                image_file,
                "image/jpeg"
            )
        }
    )

print()
print("Upload status:", upload_response.status_code)
print()
print("Backend response:")
print(upload_response.text)