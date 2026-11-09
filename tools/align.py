import re,json,math
txt=open('script.txt').read().strip()
# fragments: split after . ? ! and after ...
parts=re.split(r'(?<=[.?!])\s+',txt)
frags=[p.strip() for p in parts if p.strip()]
s=open('sd.txt').read()
st=[float(x) for x in re.findall(r'silence_start: ([\d.]+)',s)]
en=[float(x) for x in re.findall(r'silence_end: ([\d.]+)',s)]
DUR=240.168
# speech segments
segs=[];cur=0.0
pairs=list(zip(st,en))
if pairs and pairs[0][0]<0.05: cur=pairs[0][1]; pairs=pairs[1:]
for a,b in pairs:
    if a>cur: segs.append((cur,a))
    cur=b
if cur<DUR-0.05: segs.append((cur,DUR))
def ch(f): return len(re.sub(r'[^A-Za-z0-9]','',f))+ (6 if f.endswith('...') else 0)
C=[ch(f) for f in frags]
N,M=len(frags),len(segs)
speech=sum(b-a for a,b in segs); rate=speech/sum(C)
INF=1e18
f=[[INF]*(M+1) for _ in range(N+1)]; bk={}
f[0][0]=0
for i in range(N+1):
  for j in range(M+1):
    if f[i][j]>=INF: continue
    for di in range(1,4):
      if i+di>N: break
      c=sum(C[i:i+di])*rate
      for dj in range(1,6):
        if j+dj>M: break
        d=sum(b-a for a,b in segs[j:j+dj])
        cost=math.log(d/c)**2 + 0.15*(di-1)+0.05*(dj-1)
        if f[i][j]+cost<f[i+di][j+dj]:
          f[i+di][j+dj]=f[i][j]+cost; bk[(i+di,j+dj)]=(i,j)
i,j=N,M; out=[]
while (i,j)!=(0,0):
  pi,pj=bk[(i,j)]
  # split group frags proportionally inside seg span
  t0,t1=segs[pj][0],segs[j-1][1]; tot=sum(C[pi:i]); acc=0
  # within multi-frag group, try to snap internal boundaries to internal pauses
  for k in range(pi,i):
    a=t0+(t1-t0)*acc/tot; acc+=C[k]; b=t0+(t1-t0)*acc/tot
    out.append((k,a,b))
  i,j=pi,pj
out.sort()
res=[{"i":k,"t0":round(a,2),"t1":round(b,2),"text":frags[k]} for k,a,b in out]
json.dump(res,open('timing.json','w'),indent=0,ensure_ascii=False)
print(N,M,round(rate,4),f[N][M])
for r in res: print(r['t0'],r['t1'],r['text'][:50])
