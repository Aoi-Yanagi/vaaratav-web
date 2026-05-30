import os
import zipfile

def bundle_project(output_zip_name="clean_codebase.zip"):
    # Folders we strictly want to ignore to save space
    ignored_dirs = {
        'node_modules', '.git', '.next', 'build', 'dist', 
        'env', 'venv', '__pycache__', '.vercel'
    }
    
    # Specific file extensions we want to capture
    allowed_extensions = {
        '.js', '.jsx', '.ts', '.tsx', '.css', '.html', 
        '.json', '.py', '.md', '.svg'
    }

    print(f"Starting code bundling into {output_zip_name}...")
    file_count = 0

    with zipfile.ZipFile(output_zip_name, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk('.'):
            # Modify dirs in-place to skip ignored directories entirely
            dirs[:] = [d for d in dirs if d not in ignored_dirs]
            
            for file in files:
                # Security boundary check: Skip environment variable files explicitly
                if file == '.env' or file.endswith('.env.local'):
                    continue
                    
                file_ext = os.path.splitext(file)[1]
                if file_ext in allowed_extensions:
                    file_path = os.path.join(root, file)
                    # Maintain the relative directory structure inside the zip
                    arcname = os.path.relpath(file_path, '.')
                    zipf.write(file_path, arcname)
                    file_count += 1

    print(f"Success! Bundled {file_count} source files into '{output_zip_name}'.")

if __name__ == "__main__":
    bundle_project()