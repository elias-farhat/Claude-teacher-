import cv2, math
from neon import *
t = 0.8
base = background((14, 10, 30), (80, 12, 28), t); cv = Canvas(); cv.line((-10, 660), (W + 10, 660), (90, 60, 110), 3)
hd, r = person(cv, 300, 660, 420, WHITE, 'stand', t, 1)
cv.circle((hd[0] - r * .35, hd[1] - r * .1), r * .14, WHITE, 0, fill=WHITE); cv.circle((hd[0] + r * .35, hd[1] - r * .1), r * .14, WHITE, 0, fill=WHITE); cv.circle((hd[0], hd[1] + r * .45), r * .2, WHITE, 4)
hd2, r2 = person(cv, 820, 660, 440, (255, 150, 60), 'stand', t, -1)
T = [('ساعتان', (840, 150), 170, RED, 1, True), ('بقي له', (300, 90), 80, WHITE, 1, False)]
img = finish(base, cv.out(), T, t)
cv2.imwrite('/home/claude/out/thumb_ar.png', img[..., ::-1].astype('uint8'))
