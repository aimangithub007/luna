import os
import sys
import time

# Add the parent directory of backend so we can import everything correctly
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from backend.server import _resolve_chat_argv
    from hermes_cli.pty_bridge import PtyBridge
    print("✅ Imports successful")
except ImportError as e:
    print(f"❌ Import failed: {e}")
    sys.exit(1)

def test_pty():
    try:
        argv, cwd, env = _resolve_chat_argv()
        print(f"🚀 Spawning: {argv}")
        print(f"📂 CWD: {cwd}")
        
        bridge = PtyBridge.spawn(argv, cwd=cwd, env=env)
        print("✅ PTY Bridge spawned")
        
        # Read for 3 seconds to see if we get ANY output
        start_time = time.time()
        output_buffer = b""
        while time.time() - start_time < 3:
            chunk = bridge.read()
            if chunk:
                output_buffer += chunk
                print(f"📩 Received {len(chunk)} bytes")
            time.sleep(0.1)
        
        if output_buffer:
            print(f"📦 Total output: {len(output_buffer)} bytes")
            # Print first 100 bytes of output (as text if possible)
            try:
                print(f"📝 Preview: {output_buffer[:200].decode('utf-8', errors='replace')}")
            except Exception as e:
                print(f"❌ Preview error: {e}")
        else:
            print("⚠️ No output received within 3 seconds.")
            
        bridge.close()
        print("🏁 Bridge closed")
        
    except Exception as e:
        print(f"💥 Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_pty()
