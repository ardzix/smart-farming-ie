from rest_framework import serializers
from .models import CustomUser, Profile
from django.contrib.auth.password_validation import validate_password
from rest_framework.validators import UniqueValidator

class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ['phone', 'address', 'website']

class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)
    phone = serializers.CharField(write_only=True, required=False, allow_blank=True)
    address = serializers.CharField(write_only=True, required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, required=False)
    permissions = serializers.ListField(read_only=True)
    is_owner = serializers.BooleanField(read_only=True)
    org_id = serializers.CharField(read_only=True, allow_null=True)
    org_name = serializers.CharField(read_only=True, allow_null=True)
    roles = serializers.ListField(read_only=True)

    class Meta:
        model = CustomUser
        fields = (
            'id', 'username', 'email', 'first_name', 'last_name',
            'profile', 'phone', 'address', 'password',
            'permissions', 'is_owner', 'org_id', 'org_name', 'roles'
        )
        read_only_fields = ('id',)
    
    def create(self, validated_data):
        phone = validated_data.pop('phone', '')
        address = validated_data.pop('address', '')
        password = validated_data.pop('password', None)

        user = super().create(validated_data)

        if password:
            user.set_password(password)
            user.save()
            
        # Update the local profile fields
        if hasattr(user, 'profile'):
            user.profile.phone = phone
            user.profile.address = address
            user.profile.save()
            
        return user

    def update(self, instance, validated_data):
        phone = validated_data.pop('phone', None)
        address = validated_data.pop('address', None)
        password = validated_data.pop('password', None)
        
        instance = super().update(instance, validated_data)
        
        if password:
            instance.set_password(password)
            instance.save()
        
        if phone is not None:
            instance.profile.phone = phone
        if address is not None:
            instance.profile.address = address
        instance.profile.save()
        
        return instance

class RegisterSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(
        required=True,
        validators=[UniqueValidator(queryset=CustomUser.objects.all())]
    )
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = CustomUser
        fields = ('username', 'email', 'password', 'password2')

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        user = CustomUser.objects.create(
            username=validated_data['username'],
            email=validated_data['email'],
        )
        user.set_password(validated_data['password'])
        user.save()
        return user
