/**
 * [setPointInSphere - Place point in a 3D sphere]
 * @param  {[float]} x0     [x center sphere position]
 * @param  {[float]} y0     [y center sphere position]
 * @param  {[float]} z0     [z center sphere position]
 * @param  {[float]} radius [Sphere radius]
 * @return {[object]}       [The point object]
 */
export default function setPointInSphere( x0, y0, z0, radius ) {

  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos( 2 * v - 1 );
  const x = x0 + ( radius * Math.sin( phi ) * Math.cos( theta ) );
  const y = y0 + ( radius * Math.sin( phi ) * Math.sin( theta ) );
  const z = z0 + ( radius * Math.cos( phi ));

  return { x, y, z };
});
