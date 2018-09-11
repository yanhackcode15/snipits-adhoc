// const ranking = require('../src/others/ranking');
const should = require('chai').should()

const foo = 'bar';
const bev = {tea: ['oloong', 'green', 'black']};

it('should return true if data type is', function(){
	foo.should.be.a('string');	
});

foo.should.equal('bar');
foo.should.have.lengthOf(3);
bev.should.have.property('tea').with.lengthOf(3);