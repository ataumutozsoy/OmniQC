import sqlite3
import sys
import json
import os
import argparse
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), 'omniqc.db')

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    c = conn.cursor()
    
    # Projects table
    c.execute('''
        CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    ''')
    
    # Samples table
    c.execute('''
        CREATE TABLE IF NOT EXISTS samples (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER NOT NULL,
            filename TEXT NOT NULL,
            filepath TEXT NOT NULL,
            analysis_results TEXT, -- JSON string
            upload_date TEXT NOT NULL,
            FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
        )
    ''')
    
    conn.commit()
    conn.close()
    return {"status": "success", "message": "Database initialized"}

def create_project(name):
    conn = get_db_connection()
    c = conn.cursor()
    created_at = datetime.now().isoformat()
    try:
        c.execute('INSERT INTO projects (name, created_at) VALUES (?, ?)', (name, created_at))
        conn.commit()
        project_id = c.lastrowid
        conn.close()
        return {"status": "success", "data": {"id": project_id, "name": name, "created_at": created_at, "samples": []}}
    except Exception as e:
        conn.close()
        return {"status": "error", "message": str(e)}

def get_projects():
    conn = get_db_connection()
    c = conn.cursor()
    try:
        projects = c.execute('SELECT * FROM projects ORDER BY created_at DESC').fetchall()
        project_list = []
        for p in projects:
            p_dict = dict(p)
            # Get samples for this project
            samples = c.execute('SELECT * FROM samples WHERE project_id = ? ORDER BY upload_date DESC', (p['id'],)).fetchall()
            p_dict['samples'] = [dict(s) for s in samples]
            # Parse JSON results if needed, but for list view maybe not strictly necessary yet
            # Let's keep it simple for now
            for s in p_dict['samples']:
                if s['analysis_results']:
                    try:
                        s['analysis_results'] = json.loads(s['analysis_results'])
                    except:
                        pass
            project_list.append(p_dict)
        conn.close()
        return {"status": "success", "data": project_list}
    except Exception as e:
        conn.close()
        return {"status": "error", "message": str(e)}

def delete_project(project_id):
    conn = get_db_connection()
    c = conn.cursor()
    try:
        c.execute('DELETE FROM projects WHERE id = ?', (project_id,))
        conn.commit()
        conn.close()
        return {"status": "success", "message": f"Project {project_id} deleted"}
    except Exception as e:
        conn.close()
        return {"status": "error", "message": str(e)}

def add_sample(project_id, filename, filepath, analysis_results):
    conn = get_db_connection()
    c = conn.cursor()
    upload_date = datetime.now().isoformat()
    try:
        # Ensure analysis_results is a string
        if isinstance(analysis_results, dict):
            analysis_results = json.dumps(analysis_results)
            
        c.execute('INSERT INTO samples (project_id, filename, filepath, analysis_results, upload_date) VALUES (?, ?, ?, ?, ?)',
                  (project_id, filename, filepath, analysis_results, upload_date))
        conn.commit()
        sample_id = c.lastrowid
        conn.close()
        
        # Return the created sample object
        new_sample = {
            "id": sample_id,
            "project_id": project_id,
            "filename": filename,
            "filepath": filepath,
            "analysis_results": json.loads(analysis_results) if analysis_results else None,
            "upload_date": upload_date
        }
        return {"status": "success", "data": new_sample}
    except Exception as e:
        conn.close()
        return {"status": "error", "message": str(e)}

def delete_sample(sample_id):
    conn = get_db_connection()
    c = conn.cursor()
    try:
        c.execute('DELETE FROM samples WHERE id = ?', (sample_id,))
        conn.commit()
        conn.close()
        return {"status": "success", "message": f"Sample {sample_id} deleted"}
    except Exception as e:
        conn.close()
        return {"status": "error", "message": str(e)}

def update_sample(sample_id, analysis_results):
    conn = get_db_connection()
    c = conn.cursor()
    try:
        # Ensure analysis_results is a string
        if isinstance(analysis_results, dict):
            analysis_results = json.dumps(analysis_results)
            
        c.execute('UPDATE samples SET analysis_results = ? WHERE id = ?', (analysis_results, sample_id))
        conn.commit()
        
        # Get updated sample
        sample = c.execute('SELECT * FROM samples WHERE id = ?', (sample_id,)).fetchone()
        sample_dict = dict(sample)
        if sample_dict['analysis_results']:
             try:
                sample_dict['analysis_results'] = json.loads(sample_dict['analysis_results'])
             except:
                pass
                
        conn.close()
        return {"status": "success", "data": sample_dict}
    except Exception as e:
        conn.close()
        return {"status": "error", "message": str(e)}

def main():
    parser = argparse.ArgumentParser(description='OmniQC Database Manager')
    parser.add_argument('action', choices=['init', 'create_project', 'get_projects', 'delete_project', 'add_sample', 'update_sample', 'delete_sample'])
    parser.add_argument('--name', help='Project name')
    parser.add_argument('--project_id', type=int, help='Project ID')
    parser.add_argument('--sample_id', type=int, help='Sample ID')
    parser.add_argument('--filename', help='Sample filename')
    parser.add_argument('--filepath', help='Sample filepath')
    parser.add_argument('--results', help='Analysis results JSON string')

    args = parser.parse_args()
    
    result = {"status": "error", "message": "Invalid action"}

    if args.action == 'init':
        result = init_db()
    elif args.action == 'create_project':
        if args.name:
            result = create_project(args.name)
        else:
            result = {"status": "error", "message": "Missing --name"}
    elif args.action == 'get_projects':
        result = get_projects()
    elif args.action == 'delete_project':
        if args.project_id:
            result = delete_project(args.project_id)
        else:
            result = {"status": "error", "message": "Missing --project_id"}
    elif args.action == 'add_sample':
        if args.project_id and args.filename and args.filepath:
            # Results might be passed as a JSON string argument, or we might need to handle it differently
            # For CLI simplicity, we expect a JSON string if provided
            result = add_sample(args.project_id, args.filename, args.filepath, args.results)
        else:
            result = {"status": "error", "message": "Missing arguments for add_sample"}
    elif args.action == 'update_sample':
        if args.sample_id and args.results:
            result = update_sample(args.sample_id, args.results)
        else:
             result = {"status": "error", "message": "Missing arguments for update_sample"}
    elif args.action == 'delete_sample':
        if args.sample_id:
            result = delete_sample(args.sample_id)
        else:
            result = {"status": "error", "message": "Missing --sample_id"}

    print(json.dumps(result))

if __name__ == "__main__":
    # Ensure DB exists
    if not os.path.exists(DB_PATH):
        init_db()
    main()
