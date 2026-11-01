// A portable review copy; the source files stay separate for development.
const fs=require('node:fs'),path=require('node:path');const root=path.resolve(__dirname,'..');
let html=fs.readFileSync(path.join(root,'index.html'),'utf8');
html=html.replace('<link rel="stylesheet" href="style.css">',()=>'<style>'+fs.readFileSync(path.join(root,'style.css'),'utf8')+'</style>');
for(const file of ['enemy-hit-masks','engine','game']){let code=fs.readFileSync(path.join(root,'src',file+'.js'),'utf8');if(file==='game')for(const asset of ['street','player-walk','enemy','player-aim-study','player-hand-study','enemy-walk','enemy-fall'])code=code.replace('assets/'+asset+'.png','data:image/png;base64,'+fs.readFileSync(path.join(root,'assets',asset+'.png')).toString('base64'));html=html.replace('<script defer src="src/'+file+'.js"></script>','');html=html.replace('</body>',()=>'<script>'+code+'</script></body>');}
fs.writeFileSync(path.join(root,'..','Nachtschicht.html'),html);console.log('Standalone review copy: ../Nachtschicht.html');
