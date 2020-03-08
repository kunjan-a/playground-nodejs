/**
 * Created with JetBrains WebStorm.
 * User: kunjan
 * Date: 21/9/12
 * Time: 1:13 PM
 * To change this template use File | Settings | File Templates.
 */
// I am the person constructor.
function Person( name ){

// I am the person's name.
    this.name = name;

// I am the collection of traits.
    this.traits = {};

}


// Define a class method.
Person.prototype.trait = function( name, value ){

// Check to see if we are getting or setting the
// given trait for this person.
    if (arguments.length == 2){

// Set the trait.
        this.traits[ name ] = value;

// Return this object.
        return( this );

    } else {

// Return the given triat.
        return( this.traits[ name ] );

    }

};


// -------------------------------------------------- //
// -------------------------------------------------- //


// I am the girl contructor.
function Girl( name, age, weight ){

// Call the super constructor to initiate base class.
    Person.call( this, name );

// Store the additional properties.
    this.trait( "age", (age - 5) );
    this.trait( "weight", (weight - 10) );

}

// Extend the Person class.
Girl.prototype = new Person();


// -------------------------------------------------- //
// -------------------------------------------------- //
// -------------------------------------------------- //
// -------------------------------------------------- //


// Create some girl instances.
var sarah = new Girl( "Sarah", 32, 115 );
var tricia = new Girl( "Tricia", 30, 125 );

// Log the girls' traits.
console.log( "Sarah:", sarah.traits );
console.log( "Tricia:", tricia.traits );