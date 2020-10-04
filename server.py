#!/usr/bin/env python3

from flask import Flask, request, abort, jsonify, render_template, session
import os
import time
import shlex
import subprocess
import json
import urllib.request
import urllib.parse
import shutil
import datetime

key_file = open('secret_key')
# setup Flask
app = Flask(__name__, static_url_path="")
app.secret_key = key_file.read()
key_file.close()

# defining redirection from '/' to '/index.html'


@app.route('/')
def root():
    return app.send_static_file('index.html')


save_dir = "/tmp/webHydLa_" + str(os.getenv("USER"))
hylagi_processes = {}


@app.route('/start_session', methods=['GET', 'POST'])
def start_session():
    start_time = datetime.datetime.fromtimestamp(time.time())
    session_id = start_time.strftime('%Y.%m.%d.%H:%M:%S.%f')
    session['sid'] = session_id
    return ""


# defining hylagi runner
@app.route('/hydat.cgi', methods=['GET', 'POST'])
def gen_hydat():
    if request.method == 'GET':
        abort(400)

    # start_time = time.time()
    session_id = session['sid']
    save_file_prefix = session_id
    save_file_hydla = save_dir + "/" + save_file_prefix + ".hydla"
    save_file_hydat = save_dir + "/" + save_file_prefix + ".hydat"
    save_file_stdout = save_dir + "/" + save_file_prefix + ".stdout"
    save_file_stderr = save_dir + "/" + save_file_prefix + ".stderr"

    form = request.form

    if "hylagi_option" not in form:
        return jsonify(sid=session_id, error=1, message="No HyLaGI Option")

    if "hydla_code" not in form:
        return jsonify(sid=session_id, error=2, message="No HydLa Code")

    if "timeout_option" not in form:
        return jsonify(sid=session_id, error=3, message="No TimeOut")

    hylagi_args = ["hylagi"]

    hylagi_args.extend(shlex.split(form["hylagi_option"]))
    hylagi_args.append("-o")
    hylagi_args.append(save_file_hydat)

    time_out = (int(form["timeout_option"]))

    try:
        if not os.path.isdir(save_dir):
            os.mkdir(save_dir)
        f_hydla = open(save_file_hydla, "w")
        f_hydla.write(form["hydla_code"])
        f_hydla.close()
    except OSError:
        return jsonify(sid=session_id, error=3, message="OSError")

    with open(save_file_stdout, "w") as f_stdout, open(save_file_stderr, "w") as f_stderr:
        if shutil.which("hylagi") is not None:
            hylagi_args.append(save_file_hydla)
            hylagi_proc = subprocess.Popen(
                hylagi_args, stdout=f_stdout, stderr=f_stderr)
            hylagi_processes[session_id] = hylagi_proc
            try:
                hylagi_retcode = hylagi_proc.wait(timeout=time_out)
            except subprocess.TimeoutExpired:
                hylagi_proc.kill()
                return jsonify(sid=session_id, error=4, message="TimeOut")
        else:
            # hylagiがないときは、apiサーバーに投げる
            param_tuple = (
                ("code", form["hydla_code"]), ("args",
                                               hylagi_args), ("hydat_path", save_file_hydat)
            )
            encoded_param = urllib.parse.urlencode(param_tuple)
            url = "http://webhydla.ueda.info.waseda.ac.jp:8080?" + encoded_param
            try:
                res = urllib.request.urlopen(url, timeout=time_out)
            except OSError:
                return jsonify(sid=session_id, error=4, message="Timeout")
            except urllib.error.HTTPError:
                return jsonify(sid=session_id, error=5, message="Internal server error")
            response_json_encoded = res.read().decode("utf-8")
            res.close()
            response_json = json.loads(response_json_encoded)
            response_stdout = response_json["stdout"]
            response_stderr = response_json["stderr"]
            response_hydat = response_json["hydat"]
            hylagi_retcode = int(response_json["retcode"])

            try:
                f_stdout.write(response_stdout)
                f_stderr.write(response_stderr)
                with open(save_file_hydat, "w") as f_hydat:
                    f_hydat.write(response_hydat)
            except IOError:
                return jsonify(sid=session_id, error=3, message="OSError")
        f_stdout.flush()
        f_stderr.flush()

    with open(save_file_stderr, "r") as f_stderr:
        try:
            with open(save_file_stdout, "r") as f_stdout:
                if not hylagi_retcode == 0:
                    return jsonify(sid=session_id, stderr=f_stderr.read(), stdout=f_stdout.read(), error=6, message="An error has occurred in HyLaGI")
                try:
                    with open(save_file_hydat, "r") as f_hydat:
                        return jsonify(sid=session_id, error=0, message="Simulation was successful", hydat=json.load(f_hydat), stdout=f_stdout.read(), stderr=f_stderr.read())
                except IOError:
                    return jsonify(sid=session_id, error=0, message="HyLaGI was successful (but it did not make hydat)", stdout=f_stdout.read(), stderr=f_stderr.read())
        except IOError:
            return jsonify(sid=session_id, error=0, message="HyLaGI was successful (but it did not make output)")


# defining hylagi killer
@app.route('/killer', methods=['GET', 'POST'])
def kill():
    if 'sid' not in session:
        abort(400)
    session_id = session['sid']
    if session_id not in hylagi_processes:
        abort(400)
    try:
        hylagi_processes[session_id].kill()
        hylagi_processes.pop(session_id, None)
    except ProcessLookupError:
        pass  # do nothing
    session.pop('sid', None)
    return ""


flask_port = 5000


# defining error viewer
@app.route('/error.cgi', methods=['GET', 'POST'])
def gen_error():
    if request.method == 'GET':
        abort(400)
    if 'sid' not in request.form:
        abort(400)
    save_file_prefix = request.form['sid']
    save_file_stderr = save_dir + "/" + save_file_prefix + ".stderr"
    save_file_stderr = save_dir + "/" + save_file_prefix + ".stderr"
    try:
        with open(save_file_stderr, 'r') as f_stderr:
            return render_template('error.html', sid=request.form['sid'], stderr=f_stderr.read())
    except IOError:
        abort(500)


flask_port = 5000

# run server if this script is running as main program (not import sentence)
if __name__ == '__main__':
    app.config['SESSION_TYPE'] = 'filesystem'
    for error_count in range(100):
        try:
            app.run(debug=False, host='0.0.0.0',
                    port=flask_port, threaded=True)
            break
        except OSError as e:
            if not e.errno == 98:
                raise
            print(e.strerror)
            flask_port += 1
            continue
