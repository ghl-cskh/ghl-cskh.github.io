"""Dựng lại app từ mã nguồn.
Chạy:  cd src && npm i html-minifier-terser@7.2.0 && python3 build.py
Kết quả ghi đè: ../index.html, ../404.html, ../quan-tri/index.html, ../apps-script/Kho.gs
"""
import json, os, subprocess
D = os.path.dirname(os.path.abspath(__file__)) + '/'
R = os.path.dirname(D.rstrip('/')) + '/'
js = lambda t: json.dumps(t, ensure_ascii=False).replace('</', '<\\/')
# 1. ghép mã kho chi nhánh: phần đầu + phần sao lưu 23h + lõi Sheet
b = open(D+'apps-script/Backup_goc.gs').read().split('\n')
start = [i for i, l in enumerate(b) if l.startswith('/* ---------- thư mục & tệp')][0]
tail = '\n'.join(b[start:]).replace("const tok=token_(), D=collect_(tok),", "const D=collect_(),").replace("reportStatus_(tok,nBm);", "reportStatus_(nBm);")
kho = open(D+'apps-script/Kho_dau.gs').read() + '\n' + tail + '\n\n' + open(D+'apps-script/core.gs').read()
open(D+'apps-script/Kho_full.gs', 'w').write(kho)
# 2. app chi nhánh: vá app gốc v48 (bỏ Firebase, thêm lớp kho, các thay đổi v2/v2.1)
subprocess.run(['python3', D+'p2.py', D+'app_goc_v48.html', D+'_app.html'], check=True)
# 3. app quản trị
open(D+'_admin.html', 'w').write(open(D+'admin.html').read().replace('KHO_GS=__KHO_GS__', 'KHO_GS='+js(kho)))
# 4. nén và chép ra trang
mini = 'const {minify}=require("html-minifier-terser");const fs=require("fs");(async()=>{const [i,o]=process.argv.slice(1);fs.writeFileSync(o,await minify(fs.readFileSync(i,"utf8"),{collapseWhitespace:true,removeComments:true,minifyCSS:true,minifyJS:{compress:{passes:2},mangle:true}}))})()'
subprocess.run(['node', '-e', mini, D+'_app.html', R+'index.html'], check=True, cwd=D)
subprocess.run(['cp', R+'index.html', R+'404.html'], check=True)
subprocess.run(['node', '-e', mini, D+'_admin.html', R+'quan-tri/index.html'], check=True, cwd=D)
subprocess.run(['cp', D+'apps-script/Kho_full.gs', R+'apps-script/Kho.gs'], check=True)
print('Xong: index.html, 404.html, quan-tri/index.html, apps-script/Kho.gs')
