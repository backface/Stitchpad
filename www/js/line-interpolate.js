function lineInterpolate( point1, point2, distance, total )
{
  var xabs = Math.abs( point1.x - point2.x );
  var yabs = Math.abs( point1.y - point2.y );
  var xdiff = point2.x - point1.x;
  var ydiff = point2.y - point1.y;

  var length = total;
  if (!total) length = Math.sqrt( ( Math.pow( xabs, 2 ) + Math.pow( yabs, 2 ) ) );
  var steps = length / distance;
  var xstep = xdiff / steps;
  var ystep = ydiff / steps;

  var newx = 0;
  var newy = 0;
  var result = [];

  for( var s = 0; s < steps; s++ )
  {
    newx = point1.x + ( xstep * s );
    newy = point1.y + ( ystep * s );

    result.push( new Two.Vector(newx, newy));
  }

  return result;
}
