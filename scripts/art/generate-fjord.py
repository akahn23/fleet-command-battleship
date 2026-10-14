"""Generates Ravenfjord's original fjord backdrop procedurally (no source imagery).

Requires Pillow (with AVIF support) and NumPy. Run from the repo root:
    python3 scripts/art/generate-fjord.py
Writes src/assets/backdrop/fjord-{1920,960}.{avif,webp}. Output is deterministic (fixed seeds).
"""
import os
import numpy as np
from PIL import Image, ImageFilter
W,H=2400,1350
rng=np.random.default_rng(7)
def fbm1d(n,oct=9,rough=0.55,seed=0):
    r=np.random.default_rng(seed); out=np.zeros(n); amp=1; tot=0
    for o in range(oct):
        k=2**(o+2); pts=r.standard_normal(k+3)
        xs=np.linspace(0,k,n); i=xs.astype(int); t=xs-i; t=t*t*(3-2*t)
        out+=amp*(pts[i]*(1-t)+pts[i+1]*t); tot+=amp; amp*=rough
    return out/tot
def fbm2d(h,w,oct=6,seed=0,sx=1.0,sy=1.0):
    r=np.random.default_rng(seed); out=np.zeros((h,w)); amp=1; tot=0
    for o in range(oct):
        gh=int(4*sy*2**o)+2; gw=int(4*sx*2**o)+2
        g=r.random((gh,gw)).astype(np.float32)
        im=Image.fromarray((g*255).astype(np.uint8)).resize((w,h),Image.BICUBIC)
        out+=amp*np.asarray(im,np.float32)/255; tot+=amp; amp*=0.5
    return out/tot
y=np.linspace(0,1,H)[:,None]; x=np.linspace(0,1,W)[None,:]
horizon=0.63
# sky
top=np.array([8,15,22]); mid=np.array([38,58,68]); glow=np.array([96,104,98])
t=np.clip(y/horizon,0,1)
sky=top*(1-t)**1.4+mid*(t**1.4)
sky=sky[...,None] if sky.ndim==2 else sky
sky=np.broadcast_to(top,(H,W,3))*(1-t[...,None])+np.broadcast_to(mid,(H,W,3))*t[...,None]
g=np.exp(-((x-0.52)**2/0.05+(y-horizon+0.08)**2/0.012))
img=sky+g[...,None]*(glow-mid)*0.9
clouds=fbm2d(H,W,6,1,sx=1.5,sy=3)
cl=np.clip((clouds-0.45)*2.2,0,1)*np.clip(1-y/0.55,0,1)
cl=np.asarray(Image.fromarray((cl*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(18)),np.float32)/255
img=img*(1-0.35*cl[...,None])+np.array([58,70,76])*0.35*cl[...,None]
def layer(img,base,amp,seed,color,fog,snow=0.0,rough=0.58,valley=None):
    big=fbm1d(W,3,0.5,seed+50); det=fbm1d(W,10,rough,seed)
    ridge=base-amp*(0.9*(big-big.min())/(np.ptp(big)+1e-6)+0.35*np.abs(det))
    if valley is not None:
        c,wd,dep=valley; ridge=ridge+dep*np.exp(-((np.arange(W)/W-c)**2)/wd)
    ridge=np.minimum(ridge,horizon+0.002)
    mask=(y>=ridge[None,:]).astype(np.float32)
    tex=fbm2d(H,W,7,seed+9,sx=7,sy=4)
    sm=np.convolve(ridge,np.ones(61)/61,mode='same'); slope=np.gradient(sm)*W; lit=np.clip(-np.tanh((np.arange(W)/W-0.52)*12)*slope*0.15,-0.3,0.4)[None,:]*np.exp(-np.clip(y-ridge[None,:],0,1)/0.12)
    depth=np.clip((y-ridge[None,:])/0.25,0,1)
    col=np.array(color)*(0.72+0.55*tex[...,None]+lit[...,None])*(1-0.35*depth[...,None])
    if snow>0:
        s=np.clip(1-(y-ridge[None,:])/(snow*(0.4+tex)),0,1)*np.clip((tex-0.42)*6,0,1)
        col=col*(1-s[...,None]*0.7)+np.array([150,160,165])*s[...,None]*0.7
    col=col*(1-fog)+np.array(mid)*fog
    m=Image.fromarray((mask*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.8))
    m=np.asarray(m,np.float32)[...,None]/255
    return img*(1-m)+col*m, ridge
img,_=layer(img,0.48,0.30,11,[44,60,70],0.55,snow=0.06,valley=(0.52,0.012,0.18))
# mist band
mist=fbm2d(H,W,5,3,sx=4,sy=1)
band=np.exp(-((y-0.53)**2)/0.0018)*mist
img=img*(1-0.5*band[...,None])+np.array([120,135,138])*0.5*band[...,None]
img,_=layer(img,0.56,0.32,23,[26,36,42],0.25,snow=0.035,rough=0.6,valley=(0.5,0.02,0.26))
band=np.exp(-((y-0.61)**2)/0.0010)*fbm2d(H,W,5,4,sx=5,sy=1)
img=img*(1-0.45*band[...,None])+np.array([105,120,124])*0.45*band[...,None]
# near cliffs left and right
for side,seed in ((0,31),(1,41)):
    xx=np.arange(W)/W; d=xx if side==0 else 1-xx
    ridge=0.12+1.6*d**1.5+0.05*fbm1d(W,9,0.6,seed)
    mask=(y>=np.minimum(ridge,horizon+0.03)[None,:]).astype(np.float32)
    tex=fbm2d(H,W,7,seed,sx=9,sy=5)
    rim=np.exp(-np.clip(y-ridge[None,:],0,1)/0.02)*0.6
    col=np.array([24,33,39])*(0.65+0.8*tex[...,None])+np.array([88,84,72])*rim[...,None]*0.55
    m=np.asarray(Image.fromarray((mask*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1)),np.float32)[...,None]/255
    img=img*(1-m)+col*m
# water
wy=np.clip((y-horizon)/(1-horizon),0,1)
above=img[:int(horizon*H)][::-1]
refl=np.zeros_like(img); n=H-int(horizon*H)
src=above[:n] if above.shape[0]>=n else np.pad(above,((0,n-above.shape[0]),(0,0),(0,0)),mode='edge')
waves=fbm2d(n,W,6,5,sx=3,sy=28)
shift=((waves-0.5)*40*(0.3+np.linspace(0,1,n)[:,None])).astype(int)
cols=np.clip(np.arange(W)[None,:]+shift,0,W-1)
rr=src[np.arange(n)[:,None],cols]
wcol=np.array([10,24,30])
rr=np.asarray(Image.fromarray(np.clip(rr,0,255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(3)),np.float32)
water=rr*0.38+wcol*0.62
glint=np.clip((waves-0.6)*4,0,1)*np.exp(-((x-0.52)**2)/0.02)*(1-np.linspace(0,1,n)[:,None]*0.6)
water=water+glint[...,None]*np.array([150,120,80])*0.5
img[int(horizon*H):]=water*(1-0.5*wy[int(horizon*H):][...,None])
# warm fire lights along shoreline
for cx in (0.205,0.232,0.775,0.81):
    gx=np.exp(-((x-cx)**2/0.00002+(y-horizon-0.01)**2/0.00002))
    streak=np.exp(-((x-cx)**2/0.00003))*np.clip((y-horizon)/0.25,0,1)*(y>horizon)*np.exp(-(y-horizon)/0.12)*0.35
    img=img+(gx+streak)[...,None]*np.array([255,150,60])*0.6
# vignette + grain
v=1-0.42*(((x-0.5)/0.75)**2+((y-0.45)/0.9)**2)
img=img*np.clip(v,0.25,1)[...,None]
img=255*np.clip(img/255,0,1)**0.82
img+=rng.normal(0,2.2,img.shape)
out=Image.fromarray(np.clip(img,0,255).astype(np.uint8))
OUT='src/assets/backdrop'
os.makedirs(OUT,exist_ok=True)
for w in (1920,960):
    r=out.resize((w,round(w*H/W)),Image.LANCZOS)
    r.save(f'{OUT}/fjord-{w}.avif',quality=62,speed=2)
    r.save(f'{OUT}/fjord-{w}.webp',quality=80,method=6)
    print(w,os.path.getsize(f'{OUT}/fjord-{w}.avif'),os.path.getsize(f'{OUT}/fjord-{w}.webp'))
