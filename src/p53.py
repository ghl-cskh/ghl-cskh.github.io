"""p53: sửa khung ảnh ba mẹ bị kéo dài/chồng chữ trên iPhone sau khi thêm ảnh. Dùng chung app cũ và mới.
Nguyên nhân: khung ảnh dùng aspect-ratio + ảnh height:100% + hàng lưới tự giãn; Safari trên iPhone tính chiều cao theo kích thước gốc của ảnh
rồi vẽ không khớp, thẻ giãn cao hàng nghìn px và đè lên phần thông tin bên dưới. Nay khung ảnh luôn vuông theo chiều rộng và cô lập khỏi nội dung xung quanh.
python3 p53.py vào ra"""
import sys
src, dst = sys.argv[1], sys.argv[2]
s = open(src).read()
css = '''
/* v53: khung ảnh ba mẹ ổn định trên Safari iPhone */
.ph-pick{align-items:start;contain:layout;isolation:isolate}
.ph-card{align-self:start;min-width:0;height:auto;overflow:hidden}
.ph-img{position:relative;display:block;width:100%;height:auto;aspect-ratio:1/1;contain:size layout paint;overflow:hidden}
.ph-img img{position:absolute;inset:0;width:100%;height:100%;max-width:none;max-height:none;object-fit:cover;display:block}
.ph-img.ph-none{display:flex;align-items:center;justify-content:center}
.ph-card .ph-l,.ph-card .ph-acts{flex:none;width:100%}
'''
a = '\n</style>\n\n</head>'
assert s.count(a) == 1, s.count(a)
s = s.replace(a, css + a)
open(dst, 'w').write(s); print('p53 ok')
