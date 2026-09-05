import asyncio
from uvicorn import Config, Server

async def main():
    print("BEFORE RUN")

    config = Config(
        "uvicorn_test:app",
        host="127.0.0.1",
        port=8010
    )

    server = Server(config)

    await server.serve()

    print("AFTER RUN")

asyncio.run(main())