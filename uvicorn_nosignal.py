import uvicorn
from uvicorn import Config, Server


class NoSignalServer(Server):
    def install_signal_handlers(self):
        pass


if __name__ == "__main__":
    config = Config(
        "uvicorn_test:app",
        host="127.0.0.1",
        port=8010,
    )

    server = NoSignalServer(config)

    server.run()