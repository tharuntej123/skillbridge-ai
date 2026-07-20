import os

print("Writing file...")
with open("simple_out.txt", "w") as f:
    f.write(f"Python script executed successfully. Current dir: {os.getcwd()}")
print("Done!")
