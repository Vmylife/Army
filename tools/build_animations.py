#!/usr/bin/env python3
"""Append six prototype animation clips to the original auto-rigged GLB.
Requires numpy + scipy. Preserves existing Meshy geometry/textures and existing clips.
Clip movement is test-quality hand-authored procedural motion, not mocap.
"""
from pathlib import Path
import struct,json,math,copy,sys
import numpy as np
from scipy.spatial.transform import Rotation

SRC=Path(sys.argv[1]) if len(sys.argv)>1 else Path('/mnt/data/army_soldier_rigged_v01/Little_Green_Guardian_Rigged.glb')
DST=Path(sys.argv[2]) if len(sys.argv)>2 else Path(__file__).parents[1]/'assets/characters/recruit/recruit-batch1.glb'
raw=SRC.read_bytes()
magic,v,full=struct.unpack_from('<III',raw,0)
assert magic==0x46546c67 and v==2
jsn_len,jsn_type=struct.unpack_from('<II',raw,12)
j=json.loads(raw[20:20+jsn_len]);off=20+jsn_len
bin_len,bin_type=struct.unpack_from('<II',raw,off)
binary=bytearray(raw[off+8:off+8+bin_len])
idx={n['name']:i for i,n in enumerate(j['nodes']) if 'name'in n}

# Angles are degrees. Character forward is -Z in this rig.
def q(x=0,y=0,z=0): return Rotation.from_euler('xyz',[x,y,z],degrees=True).as_quat().tolist()

def lerp(a,b,u):return a+(b-a)*u
def curve(t, points):
    if t<=points[0][0]: return points[0][1]
    for (ta,va),(tb,vb) in zip(points,points[1:]):
        if ta<=t<=tb:
            u=(t-ta)/(tb-ta);u=u*u*(3-2*u)
            return lerp(va,vb,u)
    return points[-1][1]

def smoothstep(t, points):return curve(t,points)

def times_for(dur,n):return np.linspace(0,dur,n).astype('<f4')

def A(vals):return np.array(vals,dtype='<f4')

def rotation_track(clip, joint, t, dur):
    phase=t/dur
    s=math.sin(2*math.pi*phase)
    c=math.cos(2*math.pi*phase)
    if clip=='Salute':
        lift=smoothstep(t,[(0,0),(.3,1),(.92,1),(1.35,0)])
        poses={'Chest':q(-1.5*lift,0,0),'Head':q(-4*lift,-6*lift,0),
               'RightUpperArm':q(12*lift,-7*lift,112*lift),
               'RightForearm':q(-3*lift,0,88*lift),
               'RightHand':q(0,0,-30*lift),
               'LeftUpperArm':q(-3*lift,0,3*lift)}
        return poses.get(joint,q())
    if clip in ('RifleIdle','RifleWalk'):
        # Arms cradle a training rifle in front of the torso.
        walking=clip=='RifleWalk'
        swing=math.sin(2*math.pi*phase) if walking else math.sin(2*math.pi*phase)*.1
        pose={'Hips':q(1.5*abs(swing),0,1*swing),
             'Spine':q(0,0,-1.1*swing),
             'Chest':q(-3,0,.9*swing),
             'Head':q(2,-2,1*swing),
             'LeftUpperArm':q(-63,4,-24), 'LeftForearm':q(-28,0,-21), 'LeftHand':q(8,0,0),
             'RightUpperArm':q(-72,-5,28),'RightForearm':q(-35,0,13),'RightHand':q(12,0,-10)}
        if walking:
            pose.update({'LeftUpperLeg':q(20*swing),'RightUpperLeg':q(-20*swing),
                'LeftLowerLeg':q(10+17*max(0,-swing)),
                'RightLowerLeg':q(10+17*max(0,swing)),
                'LeftFoot':q(-11*swing),'RightFoot':q(11*swing)})
        return pose.get(joint,q())
    if clip=='Run':
        # Two footfalls each cycle; exaggerated enough for chibi silhouettes.
        pose={'Hips':q(7,0,3*s),'Spine':q(-3,0,-3*s),'Chest':q(-5,0,-4*s),'Head':q(6,0,3*s),
            'LeftUpperArm':q(-46*s,0,-12),'RightUpperArm':q(46*s,0,12),
            'LeftForearm':q(-32,0,-8),'RightForearm':q(-32,0,8),
            'LeftUpperLeg':q(37*s),'RightUpperLeg':q(-37*s),
            'LeftLowerLeg':q(14+46*max(0,-s)),
            'RightLowerLeg':q(14+46*max(0,s)),
            'LeftFoot':q(-18*s),'RightFoot':q(18*s)}
        return pose.get(joint,q())
    if clip=='Hit':
        f=smoothstep(t,[(0,0),(.11,1),(.29,.75),(.65,0)])
        pose={'Hips':q(-13*f,0,3*f),'Spine':q(-12*f,0,3*f),
            'Chest':q(-20*f,0,0),'Head':q(18*f,0,-8*f),
            'LeftUpperArm':q(-15*f,0,-39*f),'RightUpperArm':q(-15*f,0,39*f),
            'LeftUpperLeg':q(-7*f),'RightUpperLeg':q(-7*f)}
        return pose.get(joint,q())
    if clip=='Death':
        f=smoothstep(t,[(0,0),(.27,.13),(.76,.82),(1.22,1),(1.75,1)])
        pose={'Hips':q(-80*f,0,-12*f),
            'Spine':q(-10*f,0,4*f),'Chest':q(-7*f,0,-8*f),'Head':q(20*f,0,12*f),
            'LeftUpperArm':q(-27*f,0,-55*f),'RightUpperArm':q(-27*f,0,68*f),
            'LeftForearm':q(-25*f,0,-8*f),'RightForearm':q(-35*f,0,8*f),
            'LeftUpperLeg':q(19*f),'RightUpperLeg':q(-12*f),
            'LeftLowerLeg':q(22*f),'RightLowerLeg':q(11*f)}
        return pose.get(joint,q())
    return q()

def translate_track(clip,joint,t,dur):
    # Use Hips local translation values from bind-pose rig; keep body centered.
    base=np.array(j['nodes'][idx[joint]].get('translation',[0,0,0]),dtype='f4')
    p=t/dur
    if clip=='Salute':base[1]+=0.002*math.sin(2*math.pi*p)
    if clip=='RifleIdle':base[1]+=0.005*math.sin(2*math.pi*p)
    if clip=='RifleWalk':base[1]+=0.021*abs(math.sin(2*math.pi*p))
    if clip=='Run':base[1]+=0.035*abs(math.sin(2*math.pi*p))
    if clip=='Hit':base[2]+=0.09*smoothstep(t,[(0,0),(.13,1),(.31,.2),(.65,0)])
    if clip=='Death':
        f=smoothstep(t,[(0,0),(.32,.08),(.84,.78),(1.4,1),(1.75,1)])
        base[1]-=.23*f; base[2]+=.19*f
    return base.tolist()

# Adding tiny arrays instead of replacing original mesh geometry, textures, skins, etc.
def add_array(array,t,component=5126):
    arr=np.asarray(array,dtype='<f4' if component==5126 else '<u2')
    global binary
    padding=(-len(binary))%4
    binary.extend(b'\0'*padding)
    start=len(binary);data=arr.tobytes();binary.extend(data)
    vi=len(j['bufferViews'])
    j['bufferViews'].append({'buffer':0,'byteOffset':start,'byteLength':len(data)})
    ai=len(j['accessors']);count=len(arr) if t=='SCALAR' else arr.shape[0]
    a={'bufferView':vi,'componentType':component,'count':int(count),'type':t}
    if t=='SCALAR':a['min']=[float(arr.min())];a['max']=[float(arr.max())]
    j['accessors'].append(a)
    return ai

configs=[('Salute',1.35,22,['RightUpperArm','RightForearm','RightHand','LeftUpperArm','Chest','Head']),
 ('RifleIdle',2.2,28,['Hips','Spine','Chest','Head','LeftUpperArm','LeftForearm','LeftHand','RightUpperArm','RightForearm','RightHand']),
 ('RifleWalk',1.12,27,['Hips','Spine','Chest','Head','LeftUpperArm','LeftForearm','LeftHand','RightUpperArm','RightForearm','RightHand','LeftUpperLeg','LeftLowerLeg','LeftFoot','RightUpperLeg','RightLowerLeg','RightFoot']),
 ('Run',.78,27,['Hips','Spine','Chest','Head','LeftUpperArm','LeftForearm','RightUpperArm','RightForearm','LeftUpperLeg','LeftLowerLeg','LeftFoot','RightUpperLeg','RightLowerLeg','RightFoot']),
 ('Hit',.68,19,['Hips','Spine','Chest','Head','LeftUpperArm','RightUpperArm','LeftUpperLeg','RightUpperLeg']),
 ('Death',1.75,34,['Hips','Spine','Chest','Head','LeftUpperArm','LeftForearm','RightUpperArm','RightForearm','LeftUpperLeg','LeftLowerLeg','RightUpperLeg','RightLowerLeg'])]

for name,dur,n,tracks in configs:
    ts=times_for(dur,n)
    tix=add_array(ts,'SCALAR')
    an={'name':name,'samplers':[],'channels':[],'extras':{'prototype':True,'loop':name not in ('Hit','Death'),'description':'手工設計的原型姿勢，後續可改成正式動畫'}}
    for joint in tracks:
        vals=A([rotation_track(name,joint,float(t),dur) for t in ts])
        # Sign continuity of quaternions ensures smooth interpolation.
        for k in range(1,len(vals)):
            if np.dot(vals[k-1],vals[k])<0:vals[k]*=-1
        aix=add_array(vals,'VEC4');ch=len(an['samplers'])
        an['samplers'].append({'input':tix,'output':aix,'interpolation':'LINEAR'})
        an['channels'].append({'sampler':ch,'target':{'node':idx[joint],'path':'rotation'}})
    if name in ('Salute','RifleIdle','RifleWalk','Run','Hit','Death'):
        vals=A([translate_track(name,'Hips',float(t),dur) for t in ts])
        aix=add_array(vals,'VEC3');ch=len(an['samplers'])
        an['samplers'].append({'input':tix,'output':aix,'interpolation':'LINEAR'})
        an['channels'].append({'sampler':ch,'target':{'node':idx['Hips'],'path':'translation'}})
    j['animations'].append(an)
j['buffers'][0]['byteLength']=len(binary)
json_bytes=json.dumps(j,ensure_ascii=False,separators=(',',':')).encode('utf8')
json_bytes+=b' ' * ((-len(json_bytes))%4)
binary+=b'\0' * ((-len(binary))%4)
header=struct.pack('<III',0x46546c67,2,12+8+len(json_bytes)+8+len(binary))
DST.parent.mkdir(parents=True,exist_ok=True)
DST.write_bytes(header+struct.pack('<II',len(json_bytes),0x4e4f534a)+json_bytes+struct.pack('<II',len(binary),0x004e4942)+binary)
print('saved',DST,'length',DST.stat().st_size,'animations',[a['name'] for a in j['animations']])
