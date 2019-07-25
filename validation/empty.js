const  isEmpty = (data) => {
	if(typeof(data) == 'number' || typeof(data) == 'boolean')
	{ 
	  return false; 
	}
	if(typeof(data) == 'undefined' || data === null)
	{
	  return true; 
	}
	if(typeof(data.length) != 'undefined')
	{
	  return data.length === 0;
	}
	if(typeof data === "string" &&  ( data === "" || data === null )){
		return true;
	}
	var count = 0;
	for(var i in data)
	{
	  if(Object.prototype.hasOwnProperty.call(data, i))
	  {
		count ++;
	  }
	}
	return count === 0;
}

module.exports = isEmpty;