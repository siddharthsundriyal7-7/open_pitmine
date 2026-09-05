import time

print("PROCESS STARTED")
print("DO NOT PRESS CTRL+C")

for i in range(60):
    print(f"Running... {i + 1}")
    time.sleep(1)

print("PROCESS FINISHED")